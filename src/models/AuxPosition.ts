import Db from "../database/connectionManager"

export type IAuxPosition = {
  id?: number
  id_drank_tel_viagens_pontos: number
  asset_id: string
  driver_id: string
  position_id: string
  created_at?: Date
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class AuxEventos {
  static tableName = "aux_positions"

  public static async getAll(): Promise<IAuxPosition[]> {
    const db = Db.getConnection()
    return db(AuxEventos.tableName).select("*")
  }

  public static async getById(id: number): Promise<IAuxPosition> {
    const db = Db.getConnection()
    return db(AuxEventos.tableName).where({ id }).first()
  }

  public static async getByPositionId(
    positionId: number,
  ): Promise<IAuxPosition> {
    const db = Db.getConnection()
    return db(AuxEventos.tableName).where({ position_id: positionId }).first()
  }

  public static async create(position: IAuxPosition): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(AuxEventos.tableName).insert(position)
    return id
  }

  public static async update(
    id: number,
    position: IAuxPosition,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(AuxEventos.tableName).where({ id }).update(position)
  }

  public static async delete(id: number): Promise<void> {
    const db = Db.getConnection()
    await db(AuxEventos.tableName).where({ id }).delete()
  }
}
