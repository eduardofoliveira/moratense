import Db from "../database/connectionManagerHomeLab"

export type IPosition = {
  id: number
  positionId: number
  driverId: number
  assetId: number
  lat: number
  long: number
  km: number
  data: Date
  created_at: Date
  updated_at: Date
}

export type IPositionCreate = Omit<
  IPosition,
  "id" | "created_at" | "updated_at"
>
export type IPositionUpdate = Omit<IPosition, "id" | "updated_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Position {
  static tableName = "positions"

  public static async getAll(): Promise<IPosition[]> {
    const db = Db.getConnection()
    return db(Position.tableName).select("*")
  }

  public static async getById(id: number): Promise<IPosition> {
    const db = Db.getConnection()
    return db(Position.tableName).where({ id }).first()
  }

  public static async findMixCode(positionId: string): Promise<IPosition> {
    const db = Db.getConnection()
    return db(Position.tableName).where({ positionId }).first()
  }

  public static async create(position: IPositionCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(Position.tableName).insert(position)
    return id
  }

  public static async update(
    id: number,
    position: IPositionUpdate,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(Position.tableName).where({ id }).update(position)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(Position.tableName).where({ id }).delete()
  }
}
