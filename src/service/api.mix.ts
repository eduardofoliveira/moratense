import axios, { AxiosError, AxiosInstance } from "axios"
import JSONBig from "json-bigint"

import LogsMix from "../models/moratense/LogsMix"

type IGetSites = {
  groupId: string
}

class ApiMix {
  private static instance: ApiMix
  private localAxios: AxiosInstance
  private token = ""
  private tokenRenew: NodeJS.Timeout | null = null
  private qtdRequisicoes = 0
  private requisicoesPorMinuto = 18
  private intervaloInicio = Date.now()

  private async controlarRequisicoes(): Promise<void> {
    const agora = Date.now()
    const umMinuto = 60000

    // Verifica se o intervalo de 1 minuto já passou
    if (agora - this.intervaloInicio > umMinuto) {
      this.qtdRequisicoes = 0
      this.intervaloInicio = agora
    }

    // Se exceder o limite, aguarda 1 minuto
    if (this.qtdRequisicoes >= this.requisicoesPorMinuto) {
      console.log("Limite de requisições atingido. Aguardando 1 minuto...")
      await new Promise((resolve) => setTimeout(resolve, umMinuto))
      this.qtdRequisicoes = 0
      this.intervaloInicio = Date.now()
    }

    this.qtdRequisicoes++
  }

  private constructor() {
    this.localAxios = axios.create({
      baseURL: "https://integrate.us.mixtelematics.com",
      headers: {
        Authorization: `Bearer ${this.token ? this.token : ""}`,
      },
      timeout: 5000000,
      transformResponse: [
        (data) => {
          try {
            return JSONBig.parse(data)
          } catch (error) {
            return data
          }
        },
      ],
    })

    this.localAxios.interceptors.request.use(async (config: any) => {
      await this.controlarRequisicoes() // Controla as requisições antes de enviar
      config.metadata = { startTime: new Date() }
      return config
    })

    this.localAxios.interceptors.response.use(
      async (response: any) => {
        const endTime = new Date()
        const duration =
          endTime.getTime() - response.config.metadata.startTime.getTime()

        console.log({
          method: response.config.method.toUpperCase(),
          url_request: response.config.url,
          status_request: response.status,
          responseTime: duration,
          requestBody: JSON.stringify(response.config.data),
          returned_rows: response.data.length,
        })

        LogsMix.create({
          method: response.config.method.toUpperCase(),
          url_request: response.config.url,
          status_request: response.status,
          responseTime: duration,
          requestBody: JSON.stringify(response.config.data),
          returned_rows: response.data.length,
        })

        return response
      },
      async (error) => {
        if (error.status === 429) {
          console.log("Aguardando 60 segundos devido ao erro 429")
          await new Promise((resolve) => setTimeout(resolve, 60000))
          return this.localAxios.request(error.config)
        }

        const endTime = new Date()
        const duration =
          endTime.getTime() - error.config.metadata.startTime.getTime()

        console.log({
          method: error.config.method.toUpperCase(),
          url_request: error.config.url,
          status_request: error.status,
          responseTime: duration,
          requestBody: JSON.stringify(error.config.data),
          returned_rows: 0,
          returned_body: error.response.data,
        })

        LogsMix.create({
          method: error.config.method.toUpperCase(),
          url_request: error.config.url,
          status_request: error.status,
          responseTime: duration,
          requestBody: JSON.stringify(error.config.data),
          returned_rows: 0,
          returned_body: error.response.data,
        })

        if (
          error.status === 401 &&
          error.response.data ===
            "No access or an invalid access token received"
        ) {
          const token = await this.getToken()
          error.config.headers.Authorization = `Bearer ${token}`
          return this.localAxios.request(error.config)
        }

        return Promise.reject(error)
      },
    )
  }

  public static async getInstance(): Promise<ApiMix> {
    if (!ApiMix.instance) {
      ApiMix.instance = new ApiMix()
      await ApiMix.instance.getToken()
    }
    return ApiMix.instance
  }

  public async getToken(): Promise<any> {
    const maxRetries = 20 // Número máximo de tentativas
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const body = new URLSearchParams()
        body.append("grant_type", "password")
        body.append("username", process.env.MIX_USERNAME as string)
        body.append("password", process.env.MIX_PASSWORD as string)
        body.append("scope", "offline_access MiX.Integrate")

        const response = await this.localAxios.post(
          "https://identity.us.mixtelematics.com/core/connect/token",
          body,
          {
            auth: {
              username: process.env.MIX_CLIENT_ID as string,
              password: process.env.MIX_CLIENT_SECRET as string,
            },
          },
        )

        this.token = response.data.access_token
        this.localAxios.defaults.headers.Authorization = `Bearer ${this.token}`

        if (!this.tokenRenew) {
          this.tokenRenew = setTimeout(
            () => {
              this.getToken()
            },
            1000 * 3600 - 100,
          )
        } else {
          clearTimeout(this.tokenRenew)
          this.tokenRenew = setTimeout(
            () => {
              this.getToken()
            },
            1000 * 3600 - 100,
          )
        }

        return this.token
      } catch (error) {
        console.error(`Erro na tentativa ${attempt}:`, new Date())

        if (attempt === maxRetries) {
          console.error("Número máximo de tentativas atingido. Lançando erro.")
          if (error instanceof AxiosError) {
            console.error("Axios Error")
            console.error(error)
          }

          throw error
        }

        console.log(
          `Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`,
        )
        await delay(60000) // Espera 2 segundos antes de tentar novamente
      }
    }
  }

  public async listaCarros({ groupId }: { groupId: string }): Promise<any> {
    try {
      const response = await this.localAxios.get(`/api/assets/group/${groupId}`)
      return response.data
    } catch (error) {
      console.error(error)

      if (error instanceof AxiosError) {
        console.error("Axios Error")
        console.error(error)
      }

      throw error
    }
  }

  public async carregaViagens({
    orgId,
    token,
  }: { orgId: bigint; token?: number }): Promise<any> {
    try {
      const options = {
        method: "POST",
        url: `https://integrate.us.mixtelematics.com/api/trips/groups/createdsince/entitytype/Asset/sincetoken/${token}/quantity/1000`,
        params: { includeSubTrips: "true" },
        headers: {
          "Content-Type": "application/json",
        },
        data: JSONBig.stringify([orgId]),
      }

      const response = await this.localAxios.request(options)

      const { getsincetoken } = response.headers
      const data = response.data

      return {
        getsincetoken,
        viagens: data,
        status: response.status,
      }
    } catch (error) {
      console.error(error)

      if (error instanceof AxiosError) {
        console.error("Axios Error")
        console.error(error)
      }

      throw error
    }
  }

  public async listaEventosCarroPorDataST({
    groupId,
    token,
    codigosEventos,
  }: {
    groupId: string
    token: string
    codigosEventos: string[]
  }): Promise<any> {
    try {
      const options = {
        method: "POST",
        url: `https://integrate.us.mixtelematics.com/api/events/groups/createdsince/organisation/${groupId}/sincetoken/${token}/quantity/1000`,
        // params: { includeSubTrips: "true" },
        headers: {
          "Content-Type": "application/json",
        },
        data: JSONBig.stringify(codigosEventos.map((codigo) => BigInt(codigo))),
      }

      const response = await this.localAxios.request(options)
      const { getsincetoken, hasmoreitems } = response.headers

      return {
        getsincetoken,
        hasmoreitems,
        eventos: response.data,
        status: response.status,
      }
    } catch (error) {
      console.error(error)

      if (error instanceof AxiosError) {
        console.error("Axios Error")
        console.error(error)
      }

      throw error
    }
  }

  public async listaMotoristas({ groupId }: { groupId: string }): Promise<any> {
    try {
      const response = await this.localAxios.get(
        `/api/drivers/organisation/${groupId}`,
      )
      return response.data
    } catch (error) {
      console.error(error)

      if (error instanceof AxiosError) {
        console.error("Axios Error")
        console.error(error)
      }

      throw error
    }
  }

  public async listarPosicoes({
    groupId,
    token,
  }: { groupId: string; token: string }): Promise<any> {
    try {
      const options = {
        method: "POST",
        url: `https://integrate.us.mixtelematics.com/api/positions/groups/createdsince/entitytype/Asset/sincetoken/${token}/quantity/1000`,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSONBig.stringify([BigInt(groupId)]),
      }

      const response = await this.localAxios.request(options)
      const { getsincetoken, hasmoreitems } = response.headers

      return {
        getsincetoken,
        hasmoreitems,
        posicoes: response.data,
        status: response.status,
      }
    } catch (error) {
      console.error(error)

      if (error instanceof AxiosError) {
        console.error("Axios Error")
        console.error(error)
      }

      throw error
    }
  }

  public async buscarPosicoesPorCarroData({
    assets,
    start,
    end,
  }: {
    assets: string[]
    start: string
    end: string
  }): Promise<any> {
    const maxRetries = 20 // Número máximo de tentativas
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const options = {
          method: "POST",
          url: `https://integrate.us.mixtelematics.com/api/positions/assets/from/${start}/to/${end}`,
          headers: {
            "Content-Type": "application/json",
          },
          data: JSONBig.stringify(assets.map((asset) => BigInt(asset))),
        }

        const response = await this.localAxios.request(options)

        console.log(" ")
        console.log(response.status)
        console.log(response.statusText)
        console.log(response.data.length)

        return response.data
      } catch (error: any) {
        console.error(`Erro na tentativa ${attempt}:`, new Date())

        if (attempt === maxRetries) {
          console.error("Número máximo de tentativas atingido. Lançando erro.")
          if (error instanceof AxiosError) {
            console.error("Axios Error")
            console.error(error)
          }

          throw error
        }

        console.log(
          `Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`,
        )
        await delay(60000) // Espera 2 segundos antes de tentar novamente
      }
    }
  }

  public async getTripsByAsset({
    assets,
    start,
    end,
  }: { assets: string[]; start: string; end: string }): Promise<any> {
    const maxRetries = 20 // Número máximo de tentativas
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const options = {
          method: "POST",
          url: `https://integrate.us.mixtelematics.com/api/trips/assets/from/${start}/to/${end}`,
          headers: {
            "Content-Type": "application/json",
          },
          data: JSONBig.stringify(assets.map((asset) => BigInt(asset))),
        }

        const response = await this.localAxios.request(options)

        console.log(" ")
        console.log(response.status)
        console.log(response.statusText)
        console.log(response.data.length)

        return response.data
      } catch (error: any) {
        console.error(`Erro na tentativa ${attempt}:`, new Date())
        console.log(error.response.status)
        console.log(error.response.data)

        if (attempt === maxRetries) {
          console.error("Número máximo de tentativas atingido. Lançando erro.")
          if (error instanceof AxiosError) {
            console.error("Axios Error")
            console.error(error)
          }

          throw error
        }

        console.log(
          `Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`,
        )
        await delay(60000) // Espera 2 segundos antes de tentar novamente
      }
    }
  }

  public async getEventTypes({ orgId }: { orgId: string }): Promise<any> {
    const maxRetries = 20 // Número máximo de tentativas
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const options = {
          method: "GET",
          url: `https://integrate.us.mixtelematics.com/api/libraryevents/organisation/${orgId}`,
          headers: {
            "Content-Type": "application/json",
          },
          // data: JSONBig.stringify(assets.map((asset) => BigInt(asset))),
        }

        const response = await this.localAxios.request(options)

        return response.data
      } catch (error) {
        console.error(`Erro na tentativa ${attempt}:`, new Date())

        if (attempt === maxRetries) {
          console.error("Número máximo de tentativas atingido. Lançando erro.")
          if (error instanceof AxiosError) {
            console.error("Axios Error")
            console.error(error)
          }

          throw error
        }

        console.log(
          `Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`,
        )
        await delay(60000) // Espera 2 segundos antes de tentar novamente
      }
    }
  }

  public async getSites({ groupId }: IGetSites): Promise<any> {
    const maxRetries = 20 // Número máximo de tentativas
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const options = {
          method: "GET",
          url: `https://integrate.us.mixtelematics.com/api/organisationgroups/siteswithlegacyid/${groupId}`,
          headers: {
            "Content-Type": "application/json",
          },
        }

        const response = await this.localAxios.request(options)

        console.log(" ")
        console.log(response.status)
        console.log(response.statusText)
        console.log(response.data.length)

        return response.data
      } catch (error) {
        console.error(`Erro na tentativa ${attempt}:`, new Date())

        if (attempt === maxRetries) {
          console.error("Número máximo de tentativas atingido. Lançando erro.")
          if (error instanceof AxiosError) {
            console.error("Axios Error")
            console.error(error)
          }

          throw error
        }

        console.log(
          `Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`,
        )
        await delay(60000) // Espera 2 segundos antes de tentar novamente
      }
    }
  }

  public async getEventByAssets({
    assets,
    tempEventTypes,
    start,
    end,
  }: {
    assets: string[]
    tempEventTypes: string[]
    start: string
    end: string
  }): Promise<any> {
    const maxRetries = 20 // Número máximo de tentativas
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const options = {
          method: "POST",
          url: `https://integrate.us.mixtelematics.com/api/events/assets/from/${start}/to/${end}`,
          headers: {
            "Content-Type": "application/json",
          },
          data: JSONBig.stringify({
            EntityIds: assets.map((asset) => BigInt(asset)),
            EventTypeIds: tempEventTypes.map((eventType) => BigInt(eventType)),
          }),
        }

        const response = await this.localAxios.request(options)

        console.log(" ")
        console.log(response.status)
        console.log(response.statusText)
        console.log(response.data.length)

        return response.data
      } catch (error) {
        console.error(`Erro na tentativa ${attempt}:`, new Date())

        if (attempt === maxRetries) {
          console.error("Número máximo de tentativas atingido. Lançando erro.")
          if (error instanceof AxiosError) {
            console.error("Axios Error")
            console.error(error)
          }

          throw error
        }

        console.log(
          `Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`,
        )
        await delay(60000) // Espera 2 segundos antes de tentar novamente
      }
    }
  }
}

export default ApiMix
