import "dotenv/config"
import { format, differenceInSeconds } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"

type IParamsGerar = {
  start: string
  end: string
  monitorId: string
}

type IParamsBuscarCorridas = {
  start: string
  end: string
  motoristaId: string
}

type IParamsBuscarEventos = {
  start: string
  end: string
  driverId: string
  assetId: string
}

function sumWithPrecision(numbers: number[]): number {
  // Define a quantidade de casas decimais (3 no seu caso)
  const precision = 3
  const factor = 10 ** precision

  // Multiplica cada número pelo fator, soma e depois divide pelo fator
  const sum = numbers.reduce(
    (acc: number, num: number) => acc + Math.round(num * factor),
    0,
  )
  return sum / factor
}

const buscarDriverIdMonitor = async (monitorId: string) => {
  const connMoratense = DbMoratense.getConnection()
  const [listMotoristas] = await connMoratense.raw(`
    SELECT
      driverId
    FROM
      drivers
    WHERE
      employeeNumber = ${monitorId}
  `)

  return listMotoristas[0].driverId
}

const buscarEventos = async ({
  start,
  end,
  driverId,
  assetId,
}: IParamsBuscarEventos) => {
  const connMoratense = DbMoratense.getConnection()
  const [eventos] = await connMoratense.raw(`
      SELECT
        e.eventTypeId,
        e.driverId,
        e.assetId,
        sum(e.totalOccurances) AS totalOccurances,
        SUM(e.totalTimeSeconds) AS totalTimeSeconds,
        ec.code,
        ec.descricao_exibida
      FROM
        events e,
        events_converter ec
      WHERE
        e.eventTypeId = ec.eventTypeId and
        e.driverId = ${driverId} and
        e.assetId = ${assetId} and
        e.startDateTime BETWEEN '${format(new Date(start), "yyyy-MM:dd HH:mm:ss")}' AND '${format(new Date(end), "yyyy-MM:dd HH:mm:ss")}'
      GROUP BY
        e.eventTypeId
  `)

  return eventos
}

const buscarCorridas = async ({
  start,
  end,
  motoristaId,
}: IParamsBuscarCorridas) => {
  const connMoratense = DbMoratense.getConnection()
  const [corridas] = await connMoratense.raw(`
    SELECT
      *
    FROM
      trips
    WHERE
      driverId = ${motoristaId} and
      tripStart BETWEEN '${start}' AND '${end}'
    order by
      tripStart
  `)

  return corridas
}

const gerar = async ({ start, end, monitorId }: IParamsGerar) => {
  let intTotalMotoristas = 0
  type TotalPorCode = {
    [key: string]: {
      code: string
      totalOccurances: number
      totalTimeSeconds: number
    }
  }

  let totalPorCode: TotalPorCode = {}
  let totalTimeSecondsRides = 0
  let totalKmRides = 0
  const listaEventosMotorista = []

  const connMoratense = DbMoratense.getConnection()
  const [listFollowUps] = await connMoratense.raw(`
    SELECT
      *
    FROM
      follow_up
    WHERE
      horario BETWEEN '${start}' AND '${end}' and
      chapa_monitor = ${monitorId}
  `)

  const IdsMotoristas = listFollowUps.map(
    (followUp: any) => followUp.chapa_motorista,
  )
  const IdsMotoristasUnicos = [...new Set(IdsMotoristas)]
  intTotalMotoristas = IdsMotoristasUnicos.length

  // console.log({ intTotalMotoristas })

  const [listMotoristas] = await connMoratense.raw(`
    SELECT
      *
    FROM
      drivers
    WHERE
      employeeNumber IN (${IdsMotoristasUnicos.join(",")})
  `)

  for await (const motorista of listMotoristas) {
    const corridas = await buscarCorridas({
      start,
      end,
      motoristaId: motorista.driverId,
    })

    // console.log({
    //   corridas: corridas.length,
    // })

    for await (const corrida of corridas) {
      totalTimeSecondsRides += differenceInSeconds(
        new Date(corrida.tripEnd),
        new Date(corrida.tripStart),
      )
      totalKmRides = sumWithPrecision([
        totalKmRides,
        corrida.distanceKilometers,
      ])

      const eventos = await buscarEventos({
        start: corrida.tripStart,
        end: corrida.tripEnd,
        driverId: corrida.driverId,
        assetId: corrida.assetId,
      })

      // console.log({
      //   eventos: eventos.length,
      // })

      listaEventosMotorista.push(eventos)
    }
  }

  totalPorCode = listaEventosMotorista.reduce((acc: any, evento: any) => {
    for (const e of evento) {
      if (!acc[e.code]) {
        acc[e.code] = {
          code: e.code,
          totalOccurances: 0,
          totalTimeSeconds: 0,
        }
      }

      acc[e.code].totalOccurances += Number.parseInt(e.totalOccurances, 10)
      acc[e.code].totalTimeSeconds += Number.parseInt(e.totalTimeSeconds, 10)
    }
    return acc
  }, {})

  // console.log(totalPorCode)
  // console.log("corridas: ", corridas.length)

  // if (corridas.length > 0) {
  //   process.exit(0)
  // }

  // console.log("monitor: ", monitorId)
  // console.log(listMotoristas.length, "motoristas encontrados")
  // console.log("")

  const databaseMonitorId = await buscarDriverIdMonitor(monitorId)

  console.log(Object.keys(totalPorCode))
  Object.keys(totalPorCode).map((key: any) => {
    console.log(totalPorCode[key])
    const { code, totalOccurances, totalTimeSeconds } = totalPorCode[key]
    console.log({ code, totalOccurances, totalTimeSeconds })
  })

  const insert: any = Object.keys(totalPorCode).reduce(
    (acc: any, key: any) => {
      const { code, totalOccurances, totalTimeSeconds } = totalPorCode[key]

      const mkbe = (totalKmRides / totalOccurances).toFixed(2)
      const porcentagem = (
        (totalTimeSeconds / totalTimeSecondsRides) *
        100
      ).toFixed(2)

      if (Number.parseInt(code, 10) === 1255) {
        // (RT) Inércia M.Benz
        acc.inercia_mkbe = mkbe ?? 0
        // insert.inercia_progresso = progressoTempo ?? 0
        // insert.inercia_progresso_mkbe = progressoUltimos4 ?? 0
        acc.inercia_porcentagem = porcentagem ?? 0
      }
      if (Number.parseInt(code, 10) === 1124) {
        // (RT) Fora da Faixa Verde
        acc.fora_faixa_verde_mkbe = mkbe ?? 0
        // insert.fora_faixa_verde_progresso = progressoTempo ?? 0
        // insert.fora_faixa_verde_progresso_mkbe = progressoUltimos4 ?? 0
        acc.fora_faixa_verde_porcentagem = porcentagem ?? 0
      }
      if (Number.parseInt(code, 10) === 1250) {
        // (RT) Excesso de Rotação
        acc.excesso_rotacao_mkbe = mkbe ?? 0
        // insert.excesso_rotacao_progresso = progressoTempo ?? 0
        // insert.excesso_rotacao_progresso_mbke = progressoUltimos4 ?? 0
        acc.excesso_rotacao_porcentagem = porcentagem ?? 0
      }
      if (Number.parseInt(code, 10) === 1253) {
        // (RT) Freada Brusca
        acc.freada_brusca_mkbe = mkbe ?? 0
        // insert.freada_brusca_progresso = progressoTempo ?? 0
        // insert.freada_brusca_progresso_mkbe = progressoUltimos4 ?? 0
        acc.freada_brusca_porcentagem = porcentagem ?? 0
      }

      // Calcular o progresso com base no mbke
      if (Number.parseInt(code, 10) === 1153) {
        // (RT) Marcha Lenta Excessiva
        acc.marcha_lenta_excessiva_mkbe = mkbe ?? 0
        // insert.marcha_lenta_excessiva_progresso = progressoUltimos4 ?? 0
      }
      if (Number.parseInt(code, 10) === 1156) {
        // (RT) Aceleração Brusca
        acc.aceleracao_brusca_mkbe = mkbe ?? 0
        // insert.aceleracao_brusca_progresso = progressoTempo ?? 0
        // insert.aceleracao_brusca_progresso_mkbe = progressoUltimos4 ?? 0
        acc.aceleracao_brusca_porcentagem = porcentagem ?? 0
      }
      if (Number.parseInt(code, 10) === 1252) {
        // (RT) Curva Brusca
        acc.curva_brusca_mkbe = mkbe ?? 0
        // insert.curva_brusca_progresso = progressoUltimos4 ?? 0
      }
      if (Number.parseInt(code, 10) === 1136) {
        // (RT) Excesso de Velocidade
        acc.excesso_velocidade_mkbe = mkbe ?? 0
        // insert.excesso_velocidade_progresso = progressoUltimos4 ?? 0
      }

      return acc
    },
    {
      inercia_mkbe: 0,
      inercia_progresso: 0,
      inercia_progresso_mkbe: 0,
      inercia_porcentagem: 0,

      fora_faixa_verde_mkbe: 0,
      fora_faixa_verde_progresso: 0,
      fora_faixa_verde_progresso_mkbe: 0,
      fora_faixa_verde_porcentagem: 0,

      excesso_rotacao_mkbe: 0,
      excesso_rotacao_progresso: 0,
      excesso_rotacao_progresso_mkbe: 0,
      excesso_rotacao_porcentagem: 0,

      freada_brusca_mkbe: 0,
      freada_brusca_mkbe_progresso: 0,
      freada_brusca_mkbe_progresso_mkbe: 0,
      freada_brusca_porcentagem: 0,

      marcha_lenta_excessiva_mkbe: 0,
      marcha_lenta_excessiva_porcentagem: 0,

      aceleracao_brusca_mkbe: 0,
      aceleracao_brusca_progresso: 0,
      aceleracao_brusca_progresso_mkbe: 0,
      aceleracao_brusca_porcentagem: 0,

      curva_brusca_mkbe: 0,
      curva_brusca_porcentagem: 0,

      excesso_velocidade_mkbe: 0,
      excesso_velocidade_porcentagem: 0,

      ranking_consumo_mkbe: 0,
      ranking_consumo_progresso: 0,

      ranking_seguranca_mkbe: 0,
      ranking_seguranca_progresso: 0,

      fk_id_follow_up_type: 1,
      follow_up_date: format(new Date(start), "yyyy-MM-dd 08:00:00"),
      monitorId: databaseMonitorId,
    },
  )

  return {
    intTotalMotoristas,
    monitorId: databaseMonitorId,
    totalPorCode,
    totalTimeSecondsRides,
    insert,
  }
}

const execute = async () => {
  const start = "2025-03-24 00:00:00"
  const end = "2025-03-30 23:59:59"

  const connMoratense = DbMoratense.getConnection()
  const [listMonitorIds] = await connMoratense.raw(`
    SELECT
      chapa_monitor
    FROM
      follow_up
    WHERE
      horario BETWEEN '${start}' AND '${end}'
    GROUP BY
      chapa_monitor
    ORDER BY
      chapa_monitor
  `)

  for await (const monitorId of listMonitorIds) {
    const { chapa_monitor } = monitorId

    const result = await gerar({
      start,
      end,
      monitorId: chapa_monitor,
    })

    await connMoratense("follow_up_monitor").insert(result.insert)

    console.log(JSON.stringify(result, null, 2))
  }

  console.log("Processo finalizado com sucesso!")
}

execute()
