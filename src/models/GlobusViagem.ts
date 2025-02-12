import Db from "../database/connectionManagerHomeLab"

export type IGlobusViagem = {
  id: number
  id_empresa: number
  assetId?: string
  driverId?: string
  fk_id_globus_linha?: number
  fk_id_globus_funcionario?: number
  codigo_filial?: number
  data_saida_garagem?: Date
  data_recolhido?: Date
  codigo_frota?: number
  created_at: Date
  updated_at: Date
}

export type IGlobusViagemCreate = Omit<
  IGlobusViagem,
  "id" | "created_at" | "updated_at"
>
export type IGlobusViagemUpdate = Omit<IGlobusViagem, "id" | "created_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class GlobusViagem {
  static tableName = "globus_viagem"

  public static async getAll(): Promise<IGlobusViagem[]> {
    const db = Db.getConnection()
    return db(GlobusViagem.tableName).select("*")
  }

  public static async getById(id: number): Promise<IGlobusViagem> {
    const db = Db.getConnection()
    return db(GlobusViagem.tableName).where({ id }).first()
  }

  public static async find(
    assetId?: string,
    driverId?: string,
    codigo_filial?: number,
    codigo_frota?: number,
    data_recolhido?: Date,
    data_saida_garagem?: Date,
    fk_id_globus_funcionario?: number,
    fk_id_globus_linha?: number,
  ): Promise<IGlobusViagem> {
    const db = Db.getConnection()
    return db(GlobusViagem.tableName)
      .where({
        assetId,
        driverId,
        codigo_filial,
        codigo_frota,
        data_recolhido,
        data_saida_garagem,
        fk_id_globus_funcionario,
        fk_id_globus_linha,
      })
      .first()
  }

  public static async create(viagem: IGlobusViagemCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(GlobusViagem.tableName).insert(viagem)
    return id
  }

  public static async update(
    id: number,
    viagem: IGlobusViagemUpdate,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(GlobusViagem.tableName).where({ id }).update(viagem)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(GlobusViagem.tableName).where({ id }).delete()
  }
}
