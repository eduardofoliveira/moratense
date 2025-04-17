import { createHash } from "node:crypto"

import Db from "../../database/connectionManagerHomeLab"

export type ISite = {
  id: number
  siteId: string
  name: string
  created_at: Date
  updated_at: Date
}

export type ISiteCreate = Omit<ISite, "id" | "created_at" | "updated_at">

export type ISiteUpdate = Omit<ISite, "id" | "created_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class User {
  static tableName = "sites"

  public static async getAll(): Promise<ISite[]> {
    const db = Db.getConnection()
    return db(User.tableName).select("*")
  }

  public static async getById(id: number): Promise<ISite> {
    const db = Db.getConnection()
    return db(User.tableName).where({ id }).first()
  }

  public static async getBySiteId(siteId: string): Promise<ISite> {
    const db = Db.getConnection()
    return db(User.tableName).where({ siteId }).first()
  }

  public static async create(site: ISiteCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(User.tableName).insert(site)
    return id
  }

  public static async update(id: number, site: ISiteUpdate): Promise<void> {
    const db = Db.getConnection()
    await db(User.tableName).where({ id }).update(site)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(User.tableName).where({ id }).delete()
  }
}
