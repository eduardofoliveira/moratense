import Db from "../database/connectionManager"

type EnumTipoConta = {
  padrao: "padrao"
  acrescimo_5_minutos: "acrescimo_5_minutos"
  inercia: "inercia"
}

export type ITelemetriaTipoEvento = {
  id?: number
  id_empresa: number
  codigo: string
  nome: string
  id_tipo_original: number
  rank_seguranca: number
  rank_consulmo: number
  carregar: number
  tipo_conta: EnumTipoConta
  order_drrank: number
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class TelemetriaTiposEvento {
  static tableName = "telemetria_tipos_eventos"

  public static async getAll(): Promise<ITelemetriaTipoEvento[]> {
    const db = Db.getConnection()
    return await db(TelemetriaTiposEvento.tableName).select("*")
  }

  public static async getById(id: number): Promise<ITelemetriaTipoEvento> {
    const db = Db.getConnection()
    return await db(TelemetriaTiposEvento.tableName).where({ id }).first()
  }

  public static async getByIdEmpresa({
    id_empresa,
  }: { id_empresa: number }): Promise<ITelemetriaTipoEvento[]> {
    const db = Db.getConnection()
    return await db(TelemetriaTiposEvento.tableName)
      .select("*")
      .where({ id_empresa })
  }

  public static async create(evento: ITelemetriaTipoEvento): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(TelemetriaTiposEvento.tableName).insert(evento)
    return id
  }

  public static async update(
    id: string,
    evento: ITelemetriaTipoEvento,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(TelemetriaTiposEvento.tableName).where({ id }).update(evento)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(TelemetriaTiposEvento.tableName).where({ id }).delete()
  }
}
