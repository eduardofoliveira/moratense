import Db from "../database/connectionManagerHomeLab"

export type ITrip = {
  id: number
  assetId: string
  driverId: string
  tripId: string
  tripStart: Date
  tripEnd: Date
  maxRpm: number
  maxDecelerationKilometersPerHourPerSecond: number
  maxAccelerationKilometersPerHourPerSecond: number
  maxSpeedKilometersPerHour: number
  distanceKilometers: number
  duration: number
  standingTime: number
  drivingTime: number
  engineSeconds: number
  fuelUsedLitres: number
  endEngineSeconds: number
  startEngineSeconds: number
  endOdometerKilometers: number
  startOdometerKilometers: number
  lastHalt: Date
  firstDepart: Date
  endPositionId: string | null
  startPositionId: string | null
  created_at: Date
  updated_at: Date
}

export type ITripCreate = Omit<ITrip, "id" | "created_at" | "updated_at">
export type ITripUpdate = Omit<ITrip, "id" | "updated_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Trip {
  static tableName = "trips"

  public static async getAll(): Promise<ITrip[]> {
    const db = Db.getConnection()
    return db(Trip.tableName).select("*")
  }

  public static async getById(id: number): Promise<ITrip> {
    const db = Db.getConnection()
    return db(Trip.tableName).where({ id }).first()
  }

  public static async findMixCode(tripId: string): Promise<ITrip> {
    const db = Db.getConnection()
    return db(Trip.tableName).where({ tripId }).first()
  }

  public static async create(trip: ITripCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(Trip.tableName).insert(trip)
    return id
  }

  public static async update(id: number, trip: ITripUpdate): Promise<void> {
    const db = Db.getConnection()
    await db(Trip.tableName).where({ id }).update(trip)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(Trip.tableName).where({ id }).delete()
  }
}
