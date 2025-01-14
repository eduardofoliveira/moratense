import Db from "../database/connectionManager"

export type IDrankTelViagensPonto = {
  id?: number
  id_empresa: number
  long: number
  lat: number
  km: number
  carro: number
  data: Date
  data_turno: Date | string
  data_cadastro: Date
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class DrankTelViagens {
  static tableName = "drank_tel_viagens_pontos"

  public static async getAll(): Promise<IDrankTelViagensPonto[]> {
    const db = Db.getConnection()
    return db(DrankTelViagens.tableName).select("*")
  }

  public static async getById(id: number): Promise<IDrankTelViagensPonto> {
    const db = Db.getConnection()
    return db(DrankTelViagens.tableName).where({ id }).first()
  }

  public static async create(viagem: IDrankTelViagensPonto): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(DrankTelViagens.tableName).insert(viagem)
    return id
  }

  public static async update(
    id: string,
    viagem: IDrankTelViagensPonto,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelViagens.tableName).where({ id }).update(viagem)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelViagens.tableName).where({ id }).delete()
  }
}
