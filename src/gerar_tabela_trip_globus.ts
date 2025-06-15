import "dotenv/config"
import { addDays, format, parse, subDays, endOfDay, startOfDay } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"

const inserirViagensRelacionadas = async ({
  inicio,
  termino,
}: { inicio: string; termino: string }) => {
  // const today = new Date()
  // const inicio = format(startOfDay(subDays(today, 2)), "yyyy-MM-dd")
  // const termino = format(endOfDay(subDays(today, 1)), "yyyy-MM-dd")
  // const inicio = "2025-03-24"
  // const termino = "2025-03-25"

  const connMoratense = DbMoratense.getConnection()
  const [resumoViagensGlobus] = await connMoratense.raw(`
    SELECT
      gl.id AS id_linha_globus,
      gl.nome_linha,
      c.id AS id_chassi,
      c.numero_chassi,
      c.text_chassi,
      d.name AS nome_motorista,
      d.driverId AS driverId,
      gv.driverId as GlobusDriverId,
      a.assetId,
      a.registrationNumber,
      d.employeeNumber AS chapa,
      SUM(t.distanceKilometers) AS distanceKilometers,
      SUM(t.fuelUsedLitres) AS fuelUsedLitres,
      SUM(t.distanceKilometers) / SUM(t.fuelUsedLitres) AS media,
      SUM(TIMESTAMPDIFF(SECOND, t.tripStart, t.tripEnd)) AS duracao_viagens_segundos,
      COUNT(t.id) AS quantidade_viagens,
      GROUP_CONCAT(DISTINCT t.tripId SEPARATOR ', ') AS tripIds,
      gv.data_saida_garagem
    FROM
      globus_viagem gv,
      globus_linha gl,
      trips t,
      trips_globus_viagem tgv,
      assets a,
      asset_chassi ac,
      chassi c,
      drivers d
    WHERE
      gv.id = tgv.fk_id_globus_viagem and
      t.id = tgv.fk_id_trip and
      t.assetId = a.assetId and
      a.assetId = ac.assetId and
      ac.fk_id_chassi = c.id and
      t.driverId = d.driverId and
      gv.fk_id_globus_linha = gl.id and
      gv.data_saida_garagem BETWEEN '${inicio} 03:00:00' AND '${termino} 02:59:59'
    GROUP BY
      gv.fk_id_globus_linha,
      c.numero_chassi,
      t.driverId,
      a.assetId
  `)

  await connMoratense.raw(`
    DELETE FROM
      eventos_viagens_globus_processadas
    WHERE
      fk_id_viagens_globus_processadas in (
        SELECT id FROM viagens_globus_processadas WHERE data_saida_garagem BETWEEN '${inicio} 03:00:00' AND '${termino} 02:59:59'
      )
  `)

  await connMoratense.raw(`
    DELETE FROM viagens_globus_processadas WHERE data_saida_garagem BETWEEN '${inicio} 03:00:00' AND '${termino} 02:59:59'
  `)

  const total = resumoViagensGlobus.length
  let cont = 0
  for await (const viagem of resumoViagensGlobus) {
    cont++
    console.log(`Inserindo ${cont} de ${total}`)

    await connMoratense.raw(`
        INSERT INTO viagens_globus_processadas
          (fk_id_linha_globus, fk_id_chassi, driverId, assetId, fuelUsedLitres, distanceKilometers, media, duracao_viagens_segundos, quantidade_viagens, tripsIds, data_saida_garagem)
        VALUES
          (${viagem.id_linha_globus}, ${viagem.id_chassi}, ${viagem.GlobusDriverId ? viagem.GlobusDriverId : viagem.driverId}, ${viagem.assetId}, ${viagem.fuelUsedLitres}, ${viagem.distanceKilometers}, ${viagem.media}, ${viagem.duracao_viagens_segundos}, ${viagem.quantidade_viagens}, '${viagem.tripIds}', '${format(viagem.data_saida_garagem, "yyyy-MM-dd HH:mm:ss")}')
    `)
  }
}

const gerarIndicadores = async ({
  inicio,
  termino,
}: { inicio: string; termino: string }) => {
  // const today = new Date()
  // const inicio = format(startOfDay(subDays(today, 2)), "yyyy-MM-dd")
  // const termino = format(endOfDay(subDays(today, 1)), "yyyy-MM-dd")
  // const inicio = "2025-03-24"
  // const termino = "2025-03-25"

  const connMoratense = DbMoratense.getConnection()
  const [linhaChassi] = await connMoratense.raw(`
    SELECT
      *
    FROM
      viagens_globus_processadas
    WHERE
      eventos_processados = false
  `)

  const total = linhaChassi.length
  let cont = 0
  for await (const viagem of linhaChassi) {
    cont++
    console.log(`Gerando indicadores ${cont} de ${total}`)

    const tripsIds = viagem.tripsIds.split(",")

    const resumo: Record<
      string,
      {
        descricao_exibida: string
        code: string
        totalOccurances: number
        totalTimeSeconds: number
        seguranca: number
        consumo: number
      }
    > = {}

    const totalTrips = tripsIds.length
    let contTrip = 0
    for await (const tripId of tripsIds) {
      contTrip++
      console.log(
        `Gerando indicadores ${cont} de ${total} - ${contTrip} de ${totalTrips}`,
      )
      console.log("tripId", tripId)

      const [[trip]] = await connMoratense.raw(`
        SELECT
          *
        FROM
          trips t
        WHERE
          t.tripId = ${tripId} and
          t.tripStart BETWEEN '${inicio} 03:00:00' AND '${termino} 02:59:59'
      `)

      if (!trip) {
        continue
      }

      // if (trip.driverId && trip.driverId === "-9110386254540308778") {
      //   continue
      // }

      const [resumoEventos] = await connMoratense.raw(`
        SELECT
          ec.descricao_exibida,
          ec.code,
          sum(e.totalOccurances) AS totalOccurances,
          sum(e.totalTimeSeconds) AS totalTimeSeconds,
          et.seguranca,
          et.consumo
        FROM
          events e,
          eventtype et,
          events_converter ec
        WHERE
          e.eventTypeId = et.eventTypeId and
          e.eventTypeId = ec.eventTypeId and
          ${!trip.driverId ? "" : `e.driverId = ${trip.driverId} and`}
          e.assetId = ${trip.assetId} and
          e.startDateTime BETWEEN '${format(trip.tripStart, "yyyy-MM-dd HH:mm:ss")}' AND '${format(trip.tripEnd, "yyyy-MM-dd HH:mm:ss")}'
        GROUP BY
          e.eventTypeId
        ORDER BY
          et.consumo desc,
          et.seguranca desc,
          ec.descricao_exibida asc
      `)

      // console.log(resumoEventos)

      for await (const evento of resumoEventos) {
        if (!resumo[evento.code]) {
          resumo[evento.code] = {
            descricao_exibida: evento.descricao_exibida,
            code: evento.code,
            totalOccurances: 0,
            totalTimeSeconds: 0,
            seguranca: evento.seguranca,
            consumo: evento.consumo,
          }
        }

        resumo[evento.code].totalOccurances += Number.parseInt(
          evento.totalOccurances,
          10,
        )
        resumo[evento.code].totalTimeSeconds += Number.parseInt(
          evento.totalTimeSeconds,
          10,
        )
      }
    }

    await connMoratense.raw(`
      DELETE FROM
        eventos_viagens_globus_processadas
      WHERE
        fk_id_viagens_globus_processadas = ${viagem.id}
    `)

    for await (const evento of Object.values(resumo)) {
      await connMoratense.raw(`
        INSERT INTO
          eventos_viagens_globus_processadas
          (fk_id_viagens_globus_processadas, descricao_exibida, code, totalOccurances, totalTimeSeconds, seguranca, consumo)
        VALUES
          (${viagem.id}, '${evento.descricao_exibida}', '${evento.code}', ${evento.totalOccurances}, ${evento.totalTimeSeconds}, ${evento.seguranca}, ${evento.consumo})
      `)
    }

    await connMoratense.raw(`
      UPDATE
        viagens_globus_processadas
      SET
        eventos_processados = true,
        updated_at = NOW()
      WHERE
        id = ${viagem.id}
    `)
  }
}

const executar = async () => {
  // const today = new Date()
  // const inicio = format(startOfDay(subDays(today, 2)), "yyyy-MM-dd")
  // const termino = format(endOfDay(subDays(today, 1)), "yyyy-MM-dd")
  const inicio = "2025-01-01"
  const termino = "2025-06-14"

  let start = inicio
  let endDate = format(
    addDays(parse(start, "yyyy-MM-dd", new Date()), 1),
    "yyyy-MM-dd",
  )
  while (start !== termino) {
    console.log({ start, endDate })

    await inserirViagensRelacionadas({ inicio: start, termino: endDate })
    await gerarIndicadores({ inicio: start, termino: endDate })

    start = format(
      addDays(parse(start, "yyyy-MM-dd", new Date()), 1),
      "yyyy-MM-dd",
    )
    endDate = format(
      addDays(parse(endDate, "yyyy-MM-dd", new Date()), 1),
      "yyyy-MM-dd",
    )
  }

  console.log("FIM")
  process.exit(0)
}

executar()
