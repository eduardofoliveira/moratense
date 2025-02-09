import axios, { AxiosError, AxiosInstance } from "axios"
import JSONBig from "json-bigint"

class ApiMix {
  private static instance: ApiMix
  private localAxios: AxiosInstance
  private token = ""
  private tokenRenew: NodeJS.Timeout | null = null

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

    // this.localAxios.interceptors.request.use((request) => {
    //   request.transformResponse = [(data) => data]
    //   return request
    // })

    // this.localAxios.interceptors.response.use((response) => {
    //   response.data = JSONBig().parse(response.data)
    //   return response
    // })
  }

  public static getInstance(): ApiMix {
    if (!ApiMix.instance) {
      ApiMix.instance = new ApiMix()
    }
    return ApiMix.instance
  }

  public async getToken(): Promise<string> {
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
      console.error(error)

      if (error instanceof AxiosError) {
        console.error("Axios Error")
        console.error(error)
      }

      throw error
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
    const maxRetries = 5 // Número máximo de tentativas
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
    const maxRetries = 5 // Número máximo de tentativas
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

  public async getEventTypes({ orgId }: { orgId: string }): Promise<any> {
    const maxRetries = 5 // Número máximo de tentativas
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
    const maxRetries = 5 // Número máximo de tentativas
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
