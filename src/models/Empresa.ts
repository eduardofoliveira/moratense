import Db from "../database/connectionManager"

export type IEmpresa = {
  id?: number
  nome: string
  mapa_long: string
  mapa_lat: string
  mapa_zoom: number
  token: string
  mix_IdentityClientId: string
  mix_IdentityClientSecret: string
  mix_IdentityUsername: string
  mix_IdentityPassword: string
  mix_groupId: string
  id_administrador_tel: number
  id_administrador_gb: number
  chave_drank: string
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Empresa {
  static tableName = "empresas"

  public static async getAll(): Promise<IEmpresa[]> {
    const db = Db.getConnection()
    return db(Empresa.tableName).select("*")
  }

  public static async getById(id: number): Promise<IEmpresa> {
    const db = Db.getConnection()
    return db(Empresa.tableName).where({ id }).first()
  }

  // public static async findByCode(codigo: string): Promise<IEmpresa> {
  //   const db = Db.getConnection()
  //   return db(Test.tableName).where({ codigo }).first()
  // }

  public static async create(empresa: IEmpresa): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(Empresa.tableName).insert(empresa)
    return id
  }

  public static async update(id: string, empresa: IEmpresa): Promise<void> {
    const db = Db.getConnection()
    await db(Empresa.tableName).where({ id }).update(empresa)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(Empresa.tableName).where({ id }).delete()
  }
}
