import Db from "../database/connectionManagerHomeLab"

export type IEvent = {
  id: number
  eventId: string
  eventTypeId: string
  driverId: string
  assetId: string
  startPosition: string
  endPosition: string
  totalOccurances: number
  totalTimeSeconds: number
  startDateTime: Date
  endDateTime: Date
  eventCategory: string
  value: string
  startOdometerKilometres: string
  endOdometerKilometres: string
  fuelUsedLitres: string
  created_at: Date
  updated_at: Date
}

export type IEventCreate = Omit<IEvent, "id" | "created_at" | "updated_at">
export type IIEventUpdate = Omit<IEvent, "id" | "updated_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Event {
  static tableName = "events"

  public static async getAll(): Promise<IEvent[]> {
    const db = Db.getConnection()
    return db(Event.tableName).select("*")
  }

  public static async getById(id: number): Promise<IEvent> {
    const db = Db.getConnection()
    return db(Event.tableName).where({ id }).first()
  }

  public static async findMixCode(eventId: string): Promise<IEvent> {
    const db = Db.getConnection()
    return db(Event.tableName).where({ eventId }).first()
  }

  public static async create(event: IEventCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(Event.tableName).insert(event)
    return id
  }

  public static async update(id: number, event: IIEventUpdate): Promise<void> {
    const db = Db.getConnection()
    await db(Event.tableName).where({ id }).update(event)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(Event.tableName).where({ id }).delete()
  }
}
