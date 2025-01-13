import Db from "../database/connectionManager"

export type ITelemetriaCarro = {
  id?: number
  id_empresa: number
  carro: number
  codigo_mix: string
  ordem?: number
  carro_novo?: number
  data_cadastro: Date
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class TelemetriaCarro {
  static tableName = "telemetria_carros"

  public static async getAll(): Promise<ITelemetriaCarro[]> {
    const db = Db.getConnection()
    return db(TelemetriaCarro.tableName).select("*")
  }

  public static async getById(id: number): Promise<ITelemetriaCarro> {
    const db = Db.getConnection()
    return db(TelemetriaCarro.tableName).where({ id }).first()
  }

  public static async findByMixCode(codigo: number): Promise<ITelemetriaCarro> {
    const db = Db.getConnection()
    return db(TelemetriaCarro.tableName).where({ codigo_mix: codigo }).first()
  }

  // public static async findByCode(codigo: string): Promise<IEmpresa> {
  //   const db = Db.getConnection()
  //   return db(Test.tableName).where({ codigo }).first()
  // }

  public static async create(carro: ITelemetriaCarro): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(TelemetriaCarro.tableName).insert(carro)
    return id
  }

  public static async update(
    id: string,
    carro: ITelemetriaCarro,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(TelemetriaCarro.tableName).where({ id }).update(carro)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(TelemetriaCarro.tableName).where({ id }).delete()
  }
}
