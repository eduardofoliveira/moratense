import "dotenv/config"
import { format } from "date-fns"

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
  let totalPorCode = {}
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

  console.log({ intTotalMotoristas })

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

    console.log({
      corridas: corridas.length,
    })

    for await (const corrida of corridas) {
      const eventos = await buscarEventos({
        start: corrida.tripStart,
        end: corrida.tripEnd,
        driverId: corrida.driverId,
        assetId: corrida.assetId,
      })

      console.log({
        eventos: eventos.length,
      })

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

  return {
    intTotalMotoristas,
    monitorId: await buscarDriverIdMonitor(monitorId),
    totalPorCode,
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

    console.log(JSON.stringify(result, null, 2))
  }

  console.log("Processo finalizado com sucesso!")
}

execute()
