import Db from "../database/connectionManager"

export type IDrankTelConfig = {
  id?: number
  id_empresa: number
  nome: string
  valor: string
  data_update?: Date
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class DrankTelConfig {
  static tableName = "drank_tel_config"

  public static async getAll(): Promise<IDrankTelConfig[]> {
    const db = Db.getConnection()
    return db(DrankTelConfig.tableName).select("*")
  }

  public static async getById(id: number): Promise<IDrankTelConfig> {
    const db = Db.getConnection()
    return db(DrankTelConfig.tableName).where({ id }).first()
  }

  public static async findByName(nome: string): Promise<IDrankTelConfig> {
    const db = Db.getConnection()
    return db(DrankTelConfig.tableName).where({ nome }).first()
  }

  public static async create(carro: IDrankTelConfig): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(DrankTelConfig.tableName).insert(carro)
    return id
  }

  public static async updateValueByName({
    name,
    value,
  }: { name: string; value: string }): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelConfig.tableName)
      .where({ nome: name })
      .update({ valor: value, data_update: db.fn.now() })
  }

  public static async update(
    id: string,
    carro: IDrankTelConfig,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelConfig.tableName)
      .where({ id })
      .update({ ...carro, data_update: db.fn.now() })
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelConfig.tableName).where({ id }).delete()
  }
}
