import axios, { AxiosError, AxiosInstance } from "axios"
import JSONBig from "json-bigint"

class ApiMix {
  private static instance: ApiMix
  private localAxios: AxiosInstance
  private token = ""

  private constructor() {
    this.localAxios = axios.create({
      baseURL: "https://integrate.us.mixtelematics.com",
      headers: {
        Authorization: `Bearer ${this.token ? this.token : ""}`,
      },
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
}

export default ApiMix
