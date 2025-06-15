import "dotenv/config"
import { addDays, format, parse, subDays, endOfDay, startOfDay } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"

const vinculoPorCorridasGlobus = async ({
  start,
  end,
}: { start: string; end: string }) => {
  const connMoratense = DbMoratense.getConnection()
  const [viagensGlobus] = await connMoratense.raw(`
    SELECT
      g.id,
      g.assetId,
      g.driverId,
      g.fk_id_globus_linha,
      l.nome_linha,
      min(g.data_saida_garagem) AS data_saida_garagem,
      max(g.data_recolhido) AS data_recolhido
    FROM
      globus_viagem g,
      globus_linha l
    WHERE
      g.fk_id_globus_linha = l.id and
      g.data_saida_garagem BETWEEN '${start} 03:00:00' AND '${end} 02:59:59' and
      g.driverId IS NOT NULL and
      g.id NOT IN (select fk_id_globus_viagem from trips_globus_viagem)
    GROUP BY
      g.assetId,
      g.driverId
    ORDER BY
      g.driverId,
      min(g.data_saida_garagem),
      g.fk_id_globus_linha
  `)

  console.log(`Total de viagens encontradas: ${viagensGlobus.length}`)

  for await (const viagem of viagensGlobus) {
    const [viagensMix] = await connMoratense.raw(`
      SELECT
        *
      FROM
        trips t
      WHERE
        DATE_ADD(t.tripStart, INTERVAL (TIMESTAMPDIFF(SECOND, t.tripStart, t.tripEnd) / 2) SECOND) between '${format(viagem.data_saida_garagem, "yyyy-MM-dd HH:mm:ss")}' AND '${format(viagem.data_recolhido, "yyyy-MM-dd HH:mm:ss")}' and
        -- t.tripStart BETWEEN '${format(viagem.data_saida_garagem, "yyyy-MM-dd HH:mm:ss")}' AND '${format(viagem.data_recolhido, "yyyy-MM-dd HH:mm:ss")}' and
        t.assetId = ${viagem.assetId} and
        t.id NOT IN (
          select
            fk_id_trip
          from
            trips_globus_viagem
        )
    `)

    for await (const viagemMix of viagensMix) {
      await connMoratense.raw(`
          INSERT INTO trips_globus_viagem
            (fk_id_trip, fk_id_globus_viagem)
          VALUES
            (${viagemMix.id}, ${viagem.id})
        `)
    }
  }
}

const vinculoPorMotorista = async ({
  start,
  end,
}: { start: string; end: string }) => {
  const connMoratense = DbMoratense.getConnection()
  const [viagensGlobus] = await connMoratense.raw(`
    SELECT
      g.id,
      g.assetId,
      g.driverId,
      g.fk_id_globus_linha,
      l.nome_linha,
      min(g.data_saida_garagem) AS data_saida_garagem,
      max(g.data_recolhido) AS data_recolhido
    FROM
      globus_viagem g,
      globus_linha l
    WHERE
      g.fk_id_globus_linha = l.id and
      g.data_saida_garagem BETWEEN '${start} 03:00:00' AND '${end} 02:59:59' and
      g.driverId IS NOT NULL and
      g.id NOT IN (select fk_id_globus_viagem from trips_globus_viagem)
    GROUP BY
      g.assetId,
      g.driverId
    ORDER BY
      g.driverId,
      min(g.data_saida_garagem),
      g.fk_id_globus_linha
  `)

  for await (const viagem of viagensGlobus) {
    console.log("------")

    const viagensMotorista = viagensGlobus.filter(
      (item: { driverId: string }) => item.driverId === viagem.driverId,
    )

    if (viagensMotorista.length === 1) {
      console.log("linha unica motorista")
      console.log(viagem.driverId)
      console.log(
        `t.tripStart BETWEEN '${start} 03:00:00' AND '${end} 02:59:59'`,
      )
      console.log("")

      const [viagensMix] = await connMoratense.raw(`
        SELECT
          *
        FROM
          trips t
        WHERE
          t.tripStart BETWEEN '${start} 03:00:00' AND '${end} 02:59:59' and
          t.driverId = ${viagem.driverId} and
          t.id NOT IN (
            select
              fk_id_trip
            from
              trips_globus_viagem
          )
      `)

      for await (const viagemMix of viagensMix) {
        await connMoratense.raw(`
          INSERT INTO trips_globus_viagem
            (fk_id_trip, fk_id_globus_viagem)
          VALUES
            (${viagemMix.id}, ${viagem.id})
        `)
      }
    }

    if (viagensMotorista.length > 1) {
      let index = 0

      for await (const viagemMotorista of viagensMotorista) {
        // Primeiras viagens do dia
        if (viagemMotorista.id === viagensMotorista[0].id) {
          console.log("1ª linha motorista")
          console.log(viagem.driverId)
          console.log(
            `DATE_ADD(t.tripStart, INTERVAL (TIMESTAMPDIFF(SECOND, t.tripStart, t.tripEnd) / 2) SECOND) between '${start} 03:00:00' and '${format(viagemMotorista.data_recolhido, "yyyy-MM-dd HH:mm:ss")}'`,
          )
          console.log("")

          const [viagensMix] = await connMoratense.raw(`
            SELECT
              *
            FROM
              trips t
            WHERE
              DATE_ADD(t.tripStart, INTERVAL (TIMESTAMPDIFF(SECOND, t.tripStart, t.tripEnd) / 2) SECOND) between '${start} 03:00:00' and '${format(viagemMotorista.data_recolhido, "yyyy-MM-dd HH:mm:ss")}' and
              t.driverId = ${viagemMotorista.driverId} and
              t.id NOT IN (
                select
                  fk_id_trip
                from
                  trips_globus_viagem
              )
          `)

          for await (const viagemMix of viagensMix) {
            await connMoratense.raw(`
              INSERT INTO trips_globus_viagem
                (fk_id_trip, fk_id_globus_viagem)
              VALUES
                (${viagemMix.id}, ${viagem.id})
            `)
          }
        }

        // Viagens Intermediárias do dia
        if (
          viagemMotorista.id !== viagensMotorista[0].id &&
          viagemMotorista.id !==
          viagensMotorista[viagensMotorista.length - 1].id
        ) {
          console.log("linha do meio motorista")
          console.log(viagem.driverId)
          console.log(
            `t.tripStart BETWEEN '${format(viagensMotorista[index - 1].data_recolhido, "yyyy-MM-dd HH:mm:ss")}' AND '${format(viagensMotorista[index + 1].data_saida_garagem, "yyyy-MM-dd HH:mm:ss")}'`,
          )
          console.log("")

          const [viagensMix] = await connMoratense.raw(`
            SELECT
              *
            FROM
              trips t
            WHERE
              DATE_ADD(t.tripStart, INTERVAL (TIMESTAMPDIFF(SECOND, t.tripStart, t.tripEnd) / 2) SECOND) between '${format(viagensMotorista[index - 1].data_recolhido, "yyyy-MM-dd HH:mm:ss")}' and '${format(viagensMotorista[index + 1].data_saida_garagem, "yyyy-MM-dd HH:mm:ss")}' and
              t.driverId = ${viagemMotorista.driverId} and
              t.id NOT IN (
                select
                  fk_id_trip
                from
                  trips_globus_viagem
              )
          `)

          for await (const viagemMix of viagensMix) {
            await connMoratense.raw(`
              INSERT INTO trips_globus_viagem
                (fk_id_trip, fk_id_globus_viagem)
              VALUES
                (${viagemMix.id}, ${viagem.id})
            `)
          }
        }

        // Ultimas viagens do dia
        if (
          viagemMotorista.id ===
          viagensMotorista[viagensMotorista.length - 1].id
        ) {
          console.log("ultima linha motorista")
          console.log(viagem.driverId)
          console.log(
            `DATE_ADD(t.tripStart, INTERVAL (TIMESTAMPDIFF(SECOND, t.tripStart, t.tripEnd) / 2) SECOND) between '${format(viagemMotorista.data_saida_garagem, "yyyy-MM-dd HH:mm:ss")}' and '${end} 02:59:59'`,
          )
          console.log("")

          const [viagensMix] = await connMoratense.raw(`
            SELECT
              *
            FROM
              trips t
            WHERE
              DATE_ADD(t.tripStart, INTERVAL (TIMESTAMPDIFF(SECOND, t.tripStart, t.tripEnd) / 2) SECOND) between '${format(viagemMotorista.data_saida_garagem, "yyyy-MM-dd HH:mm:ss")}' and '${end} 02:59:59' and
              t.driverId = ${viagemMotorista.driverId} and
              t.id NOT IN (
                select
                  fk_id_trip
                from
                  trips_globus_viagem
              )
          `)

          for await (const viagemMix of viagensMix) {
            await connMoratense.raw(`
              INSERT INTO trips_globus_viagem
                (fk_id_trip, fk_id_globus_viagem)
              VALUES
                (${viagemMix.id}, ${viagem.id})
            `)
          }
        }

        index++
      }
    }
  }
}

const executar = async () => {
  const connMoratense = DbMoratense.getConnection()

  const today = new Date()
  const inicio = format(startOfDay(subDays(today, 2)), "yyyy-MM-dd")
  const termino = format(endOfDay(subDays(today, 1)), "yyyy-MM-dd")

  // const inicio = "2025-01-01"
  // const termino = "2025-06-14"

  let start = inicio
  let endDate = format(
    addDays(parse(start, "yyyy-MM-dd", new Date()), 1),
    "yyyy-MM-dd",
  )

  while (start !== termino) {
    console.log({
      start,
      endDate,
    })

    await connMoratense.raw(`
      DELETE FROM
        trips_globus_viagem
      WHERE
        fk_id_trip IN (
          SELECT
            id
          FROM
            trips
          WHERE
            tripStart BETWEEN '${inicio} 03:00:00' AND '${termino} 02:59:59'
        )
    `)

    await vinculoPorCorridasGlobus({
      start: start,
      end: endDate,
    })

    await vinculoPorMotorista({
      start: start,
      end: endDate,
    })

    start = format(
      addDays(parse(start, "yyyy-MM-dd", new Date()), 1),
      "yyyy-MM-dd",
    )
    endDate = format(
      addDays(parse(endDate, "yyyy-MM-dd", new Date()), 1),
      "yyyy-MM-dd",
    )
  }

  console.log("Vínculos atualizados com sucesso!")
  await connMoratense.destroy()
  console.log("Conexão com o banco de dados fechada.")
  process.exit(0)
}

executar()
