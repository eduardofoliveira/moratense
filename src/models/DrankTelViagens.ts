import Db from "../database/connectionManager"

export type IDrankTelViagens = {
  id?: number
  id_empresa: number
  carro: number
  id_carro_tel: number
  motorista_cod: number
  motorista_nome: string
  data_ini: Date
  data_fim: Date
  km: number
  combustivel: number
  motor_ini?: number
  motor_fim?: number
  motor_tempo: number
  max_kmh: number
  subviagem: number
  long: number
  lat: number
  data: Date
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class DrankTelViagens {
  static tableName = "drank_tel_viagens"

  public static async getAll(): Promise<IDrankTelViagens[]> {
    const db = Db.getConnection()
    return db(DrankTelViagens.tableName).select("*")
  }

  public static async getById(id: number): Promise<IDrankTelViagens> {
    const db = Db.getConnection()
    return db(DrankTelViagens.tableName).where({ id }).first()
  }

  public static async create(viagem: IDrankTelViagens): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(DrankTelViagens.tableName).insert(viagem)
    return id
  }

  public static async update(
    id: string,
    viagem: IDrankTelViagens,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelViagens.tableName).where({ id }).update(viagem)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelViagens.tableName).where({ id }).delete()
  }
}
