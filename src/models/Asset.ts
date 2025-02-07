import Db from "../database/connectionManagerHomeLab"

export type IAsset = {
  id: number
  assetId: string
  assetTypeId: number
  isDefaultImage: boolean
  engineHours: string
  odometer: number
  fmVehicleId: number
  country: string
  createdBy: string
  userState: string
  assetImageUrl: string
  assetImage: string
  iconColour: string
  icon: string
  vinNumber?: string
  year: number
  model: string
  make: string
  targetHourlyFuelConsumptionUnits: string
  targetFuelConsumptionUnits: string
  fuelType: string
  registrationNumber: string
  description: string
  siteId: number
  defaultDriverId: number
  created_at: Date
  updated_at: Date
}

export type IAssetCreate = Omit<IAsset, "id" | "created_at" | "updated_at">

export type IAssetUpdate = Omit<IAsset, "id" | "created_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Driver {
  static tableName = "assets"

  public static async getAll(): Promise<IAsset[]> {
    const db = Db.getConnection()
    return db(Driver.tableName).select("*")
  }

  public static async getById(id: number): Promise<IAsset> {
    const db = Db.getConnection()
    return db(Driver.tableName).where({ id }).first()
  }

  public static async findMixCode(assetId: string): Promise<IAsset> {
    const db = Db.getConnection()
    return db(Driver.tableName).where({ assetId }).first()
  }

  public static async create(asset: IAssetCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(Driver.tableName).insert(asset)
    return id
  }

  public static async update(id: number, asset: IAssetUpdate): Promise<void> {
    const db = Db.getConnection()
    await db(Driver.tableName).where({ id }).update(asset)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(Driver.tableName).where({ id }).delete()
  }
}
