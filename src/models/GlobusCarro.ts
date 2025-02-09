import Db from "../database/connectionManagerHomeLab"

export type IGlobusCarro = {
  id: number
  id_empresa: number
  codigo_veiculo?: number
  codigo_frota?: number
  placa?: string
  prefixo?: string
  condicao?: string
  chassi?: number
  assetId?: string
  created_at: Date
  updated_at: Date
}

export type IGlobusCarroCreate = Omit<
  IGlobusCarro,
  "id" | "created_at" | "updated_at"
>
export type IGlobusCarroUpdate = Omit<IGlobusCarro, "id" | "updated_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class GlobusCarro {
  static tableName = "globus_carro"

  public static async getAll(): Promise<IGlobusCarro[]> {
    const db = Db.getConnection()
    return db(GlobusCarro.tableName).select("*")
  }

  public static async getAllActiveItensCarregar({
    id_empresa,
  }: { id_empresa: number }): Promise<IGlobusCarro[]> {
    const db = Db.getConnection()
    return db(GlobusCarro.tableName)
      .select("*")
      .where({ carregar: true, id_empresa })
  }

  public static async getById(id: number): Promise<IGlobusCarro> {
    const db = Db.getConnection()
    return db(GlobusCarro.tableName).where({ id }).first()
  }

  public static async findMixCode(assetId: string): Promise<IGlobusCarro> {
    const db = Db.getConnection()
    return db(GlobusCarro.tableName).where({ assetId }).first()
  }

  public static async create(carro: IGlobusCarroCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(GlobusCarro.tableName).insert(carro)
    return id
  }

  public static async update(
    id: number,
    carro: IGlobusCarroUpdate,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(GlobusCarro.tableName).where({ id }).update(carro)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(GlobusCarro.tableName).where({ id }).delete()
  }
}
