import Db from "../database/connectionManagerHomeLab"
import { subHours, format } from "date-fns"

export type IGetSummaryReturn = {
  assetsQuantity: number
  distanceKilometers: number
  fuelUsedLitres: number
}

export type IGetTripsReturn = {
  eventos: any
  meta: any
  consumo: any
  numero_chassi: string
  chapa: string
  codigo: string
  codigo_funcionario: string
  nome: string
  nome_linha: string
  data_saida_garagem: string
  data_recolhido: string
  assetId: string
  driverId: string
  chassi_linha: string
  id_linha_globus: number
  id_chassi: number
}

export type IGetConsumptionReturn = {
  assetId: string
  driverId: string
  start: string
  end: string
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Summary {
  public static async getSummary({
    start,
    end,
  }: { start: string; end: string }): Promise<IGetSummaryReturn> {
    const db = Db.getConnection()

    const quantidade = db.raw(`
      SELECT
        count(distinct assetId) AS veiculos
      FROM
        trips
      WHERE
        tripStart BETWEEN '${start} 03:00:00' AND '${end} 02:59:59'
    `)

    const consumo = db.raw(`
      SELECT
        SUM(distanceKilometers) AS kms_rodados,
        SUM(fuelUsedLitres) AS litros_consumidos
      FROM
        trips
      WHERE
        tripStart BETWEEN '${start} 03:00:00' AND '${end} 02:59:59'
    `)

    const result = await Promise.all([quantidade, consumo])
    const resultQuantidade = result[0][0][0]
    const resultConsumo = result[1][0][0]

    return {
      assetsQuantity: resultQuantidade.veiculos,
      distanceKilometers: resultConsumo.kms_rodados,
      fuelUsedLitres: resultConsumo.litros_consumidos,
    }
  }

  public static async getTrips({
    start,
    end,
  }: { start: string; end: string }): Promise<IGetTripsReturn[]> {
    const db = Db.getConnection()

    const [trips] = await db.raw(`
      SELECT
        c.numero_chassi,
        a.description,
        gf.chapa,
        gf.codigo,
        gf.codigo_funcionario,
        gf.nome,
        gl.nome_linha,
        min(gv.data_saida_garagem) AS data_saida_garagem,
        max(gv.data_recolhido) AS data_recolhido,
        gv.assetId,
        gv.driverId,
        CONCAT(c.numero_chassi, ' - ', gl.nome_linha) AS chassi_linha,
        gl.id as id_linha_globus,
        c.id as id_chassi
      FROM
        globus_viagem gv,
        globus_linha gl,
        globus_funcionario gf,
        asset_chassi ac,
        chassi c,
        assets a
      WHERE
        gv.data_saida_garagem BETWEEN '${start} 03:00:00' AND '${end} 02:59:59' and
        gv.fk_id_globus_linha = gl.id and
        gv.fk_id_globus_funcionario = gf.id and
        ac.assetId = gv.assetId and
        ac.fk_id_chassi = c.id and
        a.assetId = ac.assetId and
        gv.assetId IS NOT NULL and
        gv.driverId IS NOT null
      GROUP BY
        gl.id,
        c.id,
        gf.id
      ORDER BY
        gl.nome_linha
    `)

    return trips
  }

  public static async getConsumption({
    assetId,
    driverId,
    start,
    end,
  }: IGetConsumptionReturn): Promise<any> {
    const db = Db.getConnection()

    // console.log(`
    //   SELECT
    //     t.id,
    //     t.tripId,
    //     t.distanceKilometers,
    //     t.fuelUsedLitres,
    //     t.tripStart,
    //     t.tripEnd
    //   FROM
    //     trips t
    //   WHERE
    //     t.assetId = '${assetId}' and
    //     t.driverId = '${driverId}' and
    //     DATE_ADD(t.tripStart, INTERVAL (TIMESTAMPDIFF(SECOND, t.tripStart, t.tripEnd) / 2) SECOND) between '${start}' and '${end}'
    //   --   ABS(TIMESTAMPDIFF(SECOND, t.tripStart, '${start}')) < 900
    //   -- ORDER BY
    //   --   ABS(TIMESTAMPDIFF(SECOND, t.tripStart, '${start}'))
    //   -- LIMIT 1
    // `)

    const [consumption] = await db.raw(`
      SELECT
        t.id,
        t.tripId,
        t.distanceKilometers,
        t.fuelUsedLitres,
        t.tripStart,
        t.tripEnd
      FROM
        trips t
      WHERE
        t.assetId = '${assetId}' and
        t.driverId = '${driverId}' and
        DATE_ADD(t.tripStart, INTERVAL (TIMESTAMPDIFF(SECOND, t.tripStart, t.tripEnd) / 2) SECOND) between '${start}' and '${end}' -- or
        -- '${start}' BETWEEN t.tripStart AND t.tripEnd or
        -- t.tripStart BETWEEN '${start}' AND '${end}')
      --   ABS(TIMESTAMPDIFF(SECOND, t.tripStart, '${start}')) < 900
      -- ORDER BY
      --   ABS(TIMESTAMPDIFF(SECOND, t.tripStart, '${start}'))
      -- LIMIT 1
    `)

    // if (consumption.length === 0) {
    //   const [consumption2] = await db.raw(`
    //     SELECT
    //       t.id,
    //       t.tripId,
    //       t.distanceKilometers,
    //       t.fuelUsedLitres,
    //       t.tripStart,
    //       t.tripEnd
    //     FROM
    //       trips t
    //     WHERE
    //       t.assetId = '${assetId}' and
    //       ABS(TIMESTAMPDIFF(SECOND, t.tripEnd, '${end}')) < 900
    //     ORDER BY
    //       ABS(TIMESTAMPDIFF(SECOND, t.tripEnd, '${end}'))
    //     LIMIT 1
    //   `)

    //   consumption = consumption2
    // }

    // if (consumption.length === 0) {
    //   const [consumption3] = await db.raw(`
    //     SELECT
    //       t.id,
    //       t.tripId,
    //       t.distanceKilometers,
    //       t.fuelUsedLitres,
    //       t.tripStart,
    //       t.tripEnd
    //     FROM
    //       trips t
    //     WHERE
    //       t.assetId = '${assetId}' and
    //       '${start}' BETWEEN t.tripStart AND t.tripEnd
    //   `)

    //   consumption = consumption3
    // }

    for await (const item of consumption) {
      item.tripStart = format(new Date(item.tripStart), "dd/MM/yyyy HH:mm:ss")
      item.tripEnd = format(new Date(item.tripEnd), "dd/MM/yyyy HH:mm:ss")
    }

    return consumption
  }

  public static async getEventsResumeByTrip({
    tripId,
  }: { tripId: string }): Promise<any> {
    const db = Db.getConnection()

    const [eventos] = await db.raw(`
      SELECT
        r.eventTypeId,
        r.quantity,
        r.totalOccurances,
        ec.descricao_exibida AS description,
        ec.code AS code
      FROM
        trip_events_resume r,
        events_converter ec
      WHERE
        r.eventTypeId = ec.eventTypeId and
        r.tripId = ${tripId}
    `)

    return eventos
  }

  public static async getEventsByInterval({
    start,
    end,
  }: { start: string; end: string }): Promise<any> {
    const db = Db.getConnection()
    const [eventos] = await db.raw(`
      SELECT
        COUNT(*) AS qtd,
        et.description,
        SUM(e.totalOccurances) AS totalOccurances,
        e.eventTypeId,
        e.driverId,
        e.assetId,
        (SELECT ec.code FROM events_converter ec WHERE ec.eventTypeId = e.eventTypeId) AS code
      FROM
        events e,
        eventType et
      WHERE
        e.driverId != -9110386254540308778 and
        e.eventTypeId = et.eventTypeId and
        e.startDateTime BETWEEN '${start}' AND '${end}'
      GROUP BY
        e.driverId,
        e.assetId,
        e.eventTypeId
      ORDER BY
        e.driverId,
        e.assetId,
        code
    `)

    return eventos
  }

  public static async getEventsByAssetAndDriver({
    assetId,
    driverId,
    start,
    end,
  }: IGetConsumptionReturn): Promise<any> {
    const db = Db.getConnection()

    // console.log({ assetId, driverId, start, end })
    // console.time("getEventsByAssetAndDriver")
    const [eventos] = await db.raw(`
      SELECT
        COUNT(*) AS qtd,
        et.description,
        SUM(e.totalOccurances) AS totalOccurances,
        e.eventTypeId,
        (SELECT ec.code FROM events_converter ec WHERE ec.eventTypeId = e.eventTypeId) AS code
      FROM
        events e,
        eventType et
      WHERE
        e.eventTypeId = et.eventTypeId and
        e.driverId = ${driverId} and
        e.assetId = ${assetId} and
        e.startDateTime BETWEEN '${start}' AND '${end}'
      GROUP BY
        et.eventTypeId
    `)
    // console.timeEnd("getEventsByAssetAndDriver")

    return eventos
  }
}
