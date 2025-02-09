import Db from "../database/connectionManagerHomeLab"

export type IGlobusLinha = {
  id: number
  id_empresa: number
  codigo_linha?: string
  numero_oficial_linha?: string
  nome_linha?: string
  codigo_filial?: number
  created_at: Date
  updated_at: Date
}

export type IGlobusLinhaCreate = Omit<
  IGlobusLinha,
  "id" | "created_at" | "updated_at"
>
export type IGlobusLinhaUpdate = Omit<IGlobusLinha, "id" | "created_at">

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class GlobusLinha {
  static tableName = "globus_linha"

  public static async getAll(): Promise<IGlobusLinha[]> {
    const db = Db.getConnection()
    return db(GlobusLinha.tableName).select("*")
  }

  public static async getById(id: number): Promise<IGlobusLinha> {
    const db = Db.getConnection()
    return db(GlobusLinha.tableName).where({ id }).first()
  }

  public static async findByCodigoAndFilial(
    codigo_linha: string,
    codigo_filial: number,
  ): Promise<IGlobusLinha> {
    const db = Db.getConnection()
    return db(GlobusLinha.tableName)
      .where({ codigo_linha, codigo_filial })
      .first()
  }

  public static async create(linha: IGlobusLinhaCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(GlobusLinha.tableName).insert(linha)
    return id
  }

  public static async update(
    id: number,
    linha: IGlobusLinhaUpdate,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(GlobusLinha.tableName).where({ id }).update(linha)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(GlobusLinha.tableName).where({ id }).delete()
  }
}
