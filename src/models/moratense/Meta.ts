import Db from "../../database/connectionManagerHomeLab"

export type IMeta = {
  id: number
  id_empresa: number
  fk_id_chassi: number
  fk_id_globus_linha: number
  meta: number
  supermeta: number
  premiacao_meta: number
  premiacao_supermeta: number
  media_anterior: number
  created_at: Date
  updated_at: Date
}

export type IMetaCreate = Omit<IMeta, "id" | "created_at" | "updated_at">

export type IMetaUpdate = Omit<IMeta, "id" | "created_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Meta {
  static tableName = "metas"

  public static async getAll(): Promise<IMeta[]> {
    const db = Db.getConnection()
    return db(Meta.tableName).select("*")
  }

  public static async getById(id: number): Promise<IMeta> {
    const db = Db.getConnection()
    return db(Meta.tableName).where({ id }).first()
  }

  public static async findByChassiAndLinha(
    fk_id_chassi: number,
    fk_id_globus_linha: number,
  ): Promise<IMeta> {
    const db = Db.getConnection()
    return db(Meta.tableName)
      .where({ fk_id_chassi, fk_id_globus_linha })
      .first()
  }

  public static async create(logMix: IMetaCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(Meta.tableName).insert(logMix)
    return id
  }

  public static async update(id: number, logMix: IMetaUpdate): Promise<void> {
    const db = Db.getConnection()
    await db(Meta.tableName).where({ id }).update(logMix)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(Meta.tableName).where({ id }).delete()
  }
}
