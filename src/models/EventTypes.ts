import Db from "../database/connectionManagerHomeLab"

export type IEventType = {
  id: number
  eventTypeId: string
  valueName: string
  formatType: string
  displayUnits: string
  eventType: string
  description: string
  id_empresa: number
  seguranca?: boolean
  consumo?: boolean
  carregar?: boolean
  created_at: Date
  updated_at: Date
}

export type IEventTypeCreate = Omit<
  IEventType,
  "id" | "created_at" | "updated_at"
>
export type IEventTypeUpdate = Omit<IEventType, "id" | "updated_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class EventTypes {
  static tableName = "eventtype"

  public static async getAll(): Promise<IEventType[]> {
    const db = Db.getConnection()
    return db(EventTypes.tableName).select("*")
  }

  public static async getAllActiveItensCarregar({
    id_empresa,
  }: { id_empresa: number }): Promise<IEventType[]> {
    const db = Db.getConnection()
    return db(EventTypes.tableName)
      .select("*")
      .where({ carregar: true, id_empresa })
  }

  public static async getById(id: number): Promise<IEventType> {
    const db = Db.getConnection()
    return db(EventTypes.tableName).where({ id }).first()
  }

  public static async findMixCode(eventTypeId: string): Promise<IEventType> {
    const db = Db.getConnection()
    return db(EventTypes.tableName).where({ eventTypeId }).first()
  }

  public static async create(eventType: IEventTypeCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(EventTypes.tableName).insert(eventType)
    return id
  }

  public static async update(
    id: number,
    eventType: IEventTypeUpdate,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(EventTypes.tableName).where({ id }).update(eventType)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(EventTypes.tableName).where({ id }).delete()
  }
}
