import Db from "../database/connectionManagerHomeLab"

export type IGlobusFuncionario = {
  id: number
  id_empresa: number
  chapa?: string
  codigo_funcionario?: number
  codigo?: string
  nome?: string
  apelido?: string
  driverId?: string
  created_at: Date
  updated_at: Date
}

export type IGlobusFuncionarioCreate = Omit<
  IGlobusFuncionario,
  "id" | "created_at" | "updated_at"
>
export type IGlobusFuncionarioUpdate = Omit<
  IGlobusFuncionario,
  "id" | "created_at"
>

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class GlobusCarro {
  static tableName = "globus_funcionario"

  public static async getAll(): Promise<IGlobusFuncionario[]> {
    const db = Db.getConnection()
    return db(GlobusCarro.tableName).select("*")
  }

  public static async getById(id: number): Promise<IGlobusFuncionario> {
    const db = Db.getConnection()
    return db(GlobusCarro.tableName).where({ id }).first()
  }

  public static async findByChapa(chapa: string): Promise<IGlobusFuncionario> {
    const db = Db.getConnection()
    return db(GlobusCarro.tableName).where({ chapa }).first()
  }

  public static async findByCodigo(
    codigo: string,
  ): Promise<IGlobusFuncionario> {
    const db = Db.getConnection()
    return db(GlobusCarro.tableName).where({ codigo }).first()
  }

  public static async findByCodigoNumero(
    codigo_funcionario: number,
  ): Promise<IGlobusFuncionario> {
    const db = Db.getConnection()
    return db(GlobusCarro.tableName).where({ codigo_funcionario }).first()
  }

  public static async create(
    funcionario: IGlobusFuncionarioCreate,
  ): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(GlobusCarro.tableName).insert(funcionario)
    return id
  }

  public static async update(
    id: number,
    funcionario: IGlobusFuncionarioUpdate,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(GlobusCarro.tableName).where({ id }).update(funcionario)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(GlobusCarro.tableName).where({ id }).delete()
  }
}
