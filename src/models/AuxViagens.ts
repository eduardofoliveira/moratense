import Db from "../database/connectionManager"

export type IAuxViagem = {
  id?: number
  id_drank_tel_viagens: number
  asset_id: string
  driver_id: string
  trip_id: number
  created_at?: Date
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class AuxViagens {
  static tableName = "aux_viagens"

  public static async getAll(): Promise<IAuxViagem[]> {
    const db = Db.getConnection()
    return db(AuxViagens.tableName).select("*")
  }

  public static async getById(id: number): Promise<IAuxViagem> {
    const db = Db.getConnection()
    return db(AuxViagens.tableName).where({ id }).first()
  }

  public static async getByTripId(tripId: number): Promise<IAuxViagem> {
    const db = Db.getConnection()
    return db(AuxViagens.tableName).where({ trip_id: tripId }).first()
  }

  public static async create(viagem: IAuxViagem): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(AuxViagens.tableName).insert(viagem)
    return id
  }

  public static async update(id: number, viagem: IAuxViagem): Promise<void> {
    const db = Db.getConnection()
    await db(AuxViagens.tableName).where({ id }).update(viagem)
  }

  public static async delete(id: number): Promise<void> {
    const db = Db.getConnection()
    await db(AuxViagens.tableName).where({ id }).delete()
  }
}
