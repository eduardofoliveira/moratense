import Db from "../database/connectionManagerHomeLab"

export type IDriver = {
  id: number
  fmDriverId: number
  driverId: number
  siteId: number
  country: string
  employeeNumber: number
  name: string
  created_at: Date
  updated_at: Date
}

export type IDriverCreate = Omit<IDriver, "id" | "created_at" | "updated_at">

export type IDriverUpdate = Omit<IDriver, "id" | "updated_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Driver {
  static tableName = "drivers"

  public static async getAll(): Promise<IDriver[]> {
    const db = Db.getConnection()
    return db(Driver.tableName).select("*")
  }

  public static async getById(id: number): Promise<IDriver> {
    const db = Db.getConnection()
    return db(Driver.tableName).where({ id }).first()
  }

  public static async findMixCode(
    mixCode: string,
  ): Promise<IDriver | undefined> {
    const db = Db.getConnection()
    return db(Driver.tableName).where({ mixCode }).first()
  }

  public static async create(driver: IDriverCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(Driver.tableName).insert(driver)
    return id
  }

  public static async update(id: number, driver: IDriverUpdate): Promise<void> {
    const db = Db.getConnection()
    await db(Driver.tableName).where({ id }).update(driver)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(Driver.tableName).where({ id }).delete()
  }
}
