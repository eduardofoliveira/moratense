import Db from "../database/connectionManager"

export type IAuxEvento = {
  id?: number
  id_drank_tel_eventos: number
  asset_id: string
  driver_id: string
  event_id: number
  event_type_id: number
  created_at?: Date
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class AuxEventos {
  static tableName = "aux_eventos"

  public static async getAll(): Promise<IAuxEvento[]> {
    const db = Db.getConnection()
    return db(AuxEventos.tableName).select("*")
  }

  public static async getById(id: number): Promise<IAuxEvento> {
    const db = Db.getConnection()
    return db(AuxEventos.tableName).where({ id }).first()
  }

  public static async getByEventId(eventId: number): Promise<IAuxEvento> {
    const db = Db.getConnection()
    return db(AuxEventos.tableName).where({ event_id: eventId }).first()
  }

  public static async create(viagem: IAuxEvento): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(AuxEventos.tableName).insert(viagem)
    return id
  }

  public static async update(id: number, viagem: IAuxEvento): Promise<void> {
    const db = Db.getConnection()
    await db(AuxEventos.tableName).where({ id }).update(viagem)
  }

  public static async delete(id: number): Promise<void> {
    const db = Db.getConnection()
    await db(AuxEventos.tableName).where({ id }).delete()
  }
}
