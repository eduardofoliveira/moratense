import Db from "../../database/connectionManagerHomeLab"

export type ILogMix = {
  id: number
  method: string
  url_request: string
  status_request: number
  responseTime: number
  requestBody: string
  returned_rows: number
  returned_body?: string
  created_at: Date
  updated_at: Date
}

export type ILogMixCreate = Omit<ILogMix, "id" | "created_at" | "updated_at">

export type ILogMixUpdate = Omit<ILogMix, "id" | "created_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class LogsMix {
  static tableName = "logs_mix"

  public static async getAll(): Promise<ILogMix[]> {
    const db = Db.getConnection()
    return db(LogsMix.tableName).select("*")
  }

  public static async getById(id: number): Promise<ILogMix> {
    const db = Db.getConnection()
    return db(LogsMix.tableName).where({ id }).first()
  }

  public static async create(logMix: ILogMixCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(LogsMix.tableName).insert(logMix)
    return id
  }

  public static async update(id: number, logMix: ILogMixUpdate): Promise<void> {
    const db = Db.getConnection()
    await db(LogsMix.tableName).where({ id }).update(logMix)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(LogsMix.tableName).where({ id }).delete()
  }
}
