import Db from "../database/connectionManager"

export type ITelemetriaTipoEventoConverter = {
  id?: number
  id_empresa: number
  id_mix_entrada: string
  id_tipo_saida: number
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class TelemetriaTiposEventoConverter {
  static tableName = "telemetria_tipos_eventos_converter"

  public static async getAll(): Promise<ITelemetriaTipoEventoConverter[]> {
    const db = Db.getConnection()
    return db(TelemetriaTiposEventoConverter.tableName).select("*")
  }

  public static async getById(
    id: number,
  ): Promise<ITelemetriaTipoEventoConverter> {
    const db = Db.getConnection()
    return db(TelemetriaTiposEventoConverter.tableName).where({ id }).first()
  }

  public static async getByIdEmpresa({
    id_empresa,
  }: { id_empresa: number }): Promise<ITelemetriaTipoEventoConverter[]> {
    const db = Db.getConnection()
    return await db(TelemetriaTiposEventoConverter.tableName)
      .select("*")
      .where({ id_empresa })
  }

  public static async create(
    evento: ITelemetriaTipoEventoConverter,
  ): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(TelemetriaTiposEventoConverter.tableName).insert(
      evento,
    )
    return id
  }

  public static async update(
    id: string,
    evento: ITelemetriaTipoEventoConverter,
  ): Promise<void> {
    const db = Db.getConnection()
    await db(TelemetriaTiposEventoConverter.tableName)
      .where({ id })
      .update(evento)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(TelemetriaTiposEventoConverter.tableName).where({ id }).delete()
  }
}
