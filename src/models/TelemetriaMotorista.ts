import Db from "../database/connectionManager"

export type ITelemetriaMotorista = {
  id?: number
  id_empresa: number
  codigo: string
  nome: string
  codigo_motorista: number
  data_cadastro: Date
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class TelemetriaMotorista {
  static tableName = "telemetria_motoristas"

  public static async getAll(): Promise<ITelemetriaMotorista[]> {
    const db = Db.getConnection()
    return await db(TelemetriaMotorista.tableName).select("*")
  }

  public static async getById(id: number): Promise<ITelemetriaMotorista> {
    const db = Db.getConnection()
    return await db(TelemetriaMotorista.tableName).where({ id }).first()
  }

  public static async getByCodigoMix(
    codigo: string,
  ): Promise<ITelemetriaMotorista> {
    const db = Db.getConnection()
    return await db(TelemetriaMotorista.tableName).where({ codigo }).first()
  }

  public static async getByCodigoMotorista(
    codigo_motorista: number,
  ): Promise<ITelemetriaMotorista> {
    const db = Db.getConnection()
    return await db(TelemetriaMotorista.tableName)
      .where({ codigo_motorista })
      .first()
  }

  public static async getByIdEmpresa({
    id_empresa,
  }: { id_empresa: number }): Promise<ITelemetriaMotorista[]> {
    const db = Db.getConnection()
    return await db(TelemetriaMotorista.tableName)
      .select("*")
      .where({ id_empresa })
  }

  public static async create(motorista: ITelemetriaMotorista): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(TelemetriaMotorista.tableName).insert(motorista)
    return id
  }

  public static async update(
    id: string,
    motorista: ITelemetriaMotorista,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(TelemetriaMotorista.tableName).where({ id }).update(motorista)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(TelemetriaMotorista.tableName).where({ id }).delete()
  }
}
