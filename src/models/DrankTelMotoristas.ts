import Db from "../database/connectionManager"

export type IDrankTelMotoristas = {
  id?: number
  id_empresa: number
  codigo: string
  nome: string
  codigo_motorista: number
  data_cadastro: Date
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class DrankTelMotoristas {
  static tableName = "drank_tel_motoristas"

  public static async getAll(): Promise<IDrankTelMotoristas[]> {
    const db = Db.getConnection()
    return db(DrankTelMotoristas.tableName).select("*")
  }

  public static async getById(id: number): Promise<IDrankTelMotoristas> {
    const db = Db.getConnection()
    return db(DrankTelMotoristas.tableName).where({ id }).first()
  }

  public static async findByMixCode(
    codigo_mix: string,
  ): Promise<IDrankTelMotoristas> {
    const db = Db.getConnection()
    return db(DrankTelMotoristas.tableName)
      .where({ codigo: codigo_mix })
      .first()
  }

  public static async create(motorista: IDrankTelMotoristas): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(DrankTelMotoristas.tableName).insert(motorista)
    return id
  }

  public static async update(
    id: number,
    motorista: IDrankTelMotoristas,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelMotoristas.tableName).where({ id }).update(motorista)
  }

  public static async delete(id: number): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelMotoristas.tableName).where({ id }).delete()
  }
}
