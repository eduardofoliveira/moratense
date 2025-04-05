import Db from "../database/connectionManager"

export type IDrankTelEvento = {
  id?: number
  id_empresa: number
  carro: number
  id_carro_tel: number
  id_tipo: number
  id_motorista: number
  codigo_motorista_gb?: number
  codigo_motorista_db_teste?: number
  data_turno_tel: Date | string
  data_ini: Date | string
  data_fim: Date | string
  tempo: number
  valor_evento?: string
  quantidades_ocorrencias: number
  id_endereco?: number
  long: string
  lat: string
  data: Date
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class DrankTelEvento {
  static tableName = "drank_tel_eventos"

  public static async getAll(): Promise<IDrankTelEvento[]> {
    const db = Db.getConnection()
    return db(DrankTelEvento.tableName).select("*")
  }

  public static async getById(id: number): Promise<IDrankTelEvento> {
    const db = Db.getConnection()
    return db(DrankTelEvento.tableName).where({ id }).first()
  }

  public static async create(evento: IDrankTelEvento): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(DrankTelEvento.tableName).insert(evento)
    return id
  }

  public static async update(
    id: number,
    evento: IDrankTelEvento,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelEvento.tableName).where({ id }).update(evento)
  }

  public static async delete(id: number): Promise<void> {
    const db = Db.getConnection()
    await db(DrankTelEvento.tableName).where({ id }).delete()
  }
}
