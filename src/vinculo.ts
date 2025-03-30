import "dotenv/config"
import { addDays, format, parse } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"

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
      -- assets a,
      globus_linha l
    WHERE
      -- g.assetId = a.assetId and
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
          t.driverId = ${viagem.driverId}
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
              t.driverId = ${viagemMotorista.driverId}
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
              t.driverId = ${viagemMotorista.driverId}
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
              t.driverId = ${viagemMotorista.driverId}
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

const vinculoPorCarro = async ({
  start,
  end,
}: { start: string; end: string }) => {
  const connMoratense = DbMoratense.getConnection()
  const [viagensGlobus] = await connMoratense.raw(`
    SELECT
      g.assetId,
      g.fk_id_globus_linha,
      g.id AS id_globus_viagem,
      g.data_saida_garagem,
      g.data_recolhido
    FROM
      globus_viagem g,
      globus_linha l
    WHERE
      g.fk_id_globus_linha = l.id and
      g.data_saida_garagem BETWEEN '${start} 03:00:00' AND '${end} 02:59:59' and
      g.assetId IS NOT NULL and
      g.assetId IN (
        SELECT
          distinct t.assetId
        FROM
          trips t
        WHERE
          t.tripStart BETWEEN '${start} 03:00:00' AND '${end} 02:59:59' and
          t.id NOT IN (
            select
              fk_id_trip
            from
              trips_globus_viagem
          )
      )
    ORDER BY
      g.data_saida_garagem
  `)

  for await (const viagem of viagensGlobus) {
    console.log("------")
    console.log(viagem.assetId)
    console.log(
      `t.tripStart BETWEEN '${format(viagem.data_saida_garagem, "yyyy-MM-dd HH:mm:ss")}' AND '${format(viagem.data_recolhido, "yyyy-MM-dd HH:mm:ss")}'`,
    )
    console.log("")

    const [viagensMix] = await connMoratense.raw(`
      SELECT
        *
      FROM
        trips t
      WHERE
        t.tripStart BETWEEN '${format(viagem.data_saida_garagem, "yyyy-MM-dd HH:mm:ss")}' AND '${format(viagem.data_recolhido, "yyyy-MM-dd HH:mm:ss")}' and
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
          (${viagemMix.id}, ${viagem.id_globus_viagem})
      `)
    }

    const [viagensMixEnd] = await connMoratense.raw(`
      SELECT
        *
      FROM
        trips t
      WHERE
        t.tripEnd BETWEEN '${format(viagem.data_saida_garagem, "yyyy-MM-dd HH:mm:ss")}' AND '${format(viagem.data_recolhido, "yyyy-MM-dd HH:mm:ss")}' and
        t.assetId = ${viagem.assetId} and
        t.id NOT IN (
          select
            fk_id_trip
          from
            trips_globus_viagem
        )
    `)

    for await (const viagemMix of viagensMixEnd) {
      await connMoratense.raw(`
        INSERT INTO trips_globus_viagem
          (fk_id_trip, fk_id_globus_viagem)
        VALUES
          (${viagemMix.id}, ${viagem.id_globus_viagem})
      `)
    }
  }
  console.log("------")
}

const executar = async () => {
  // executar as funções entre os dias 01-03 até 28-03 executando dia por dia
  let start = "2025-03-01"
  let endDate = "2025-03-02"
  while (start !== "2025-03-28") {
    console.log({ start, endDate })
    // await vinculoPorMotorista({ start, end: endDate })
    await vinculoPorCarro({ start, end: endDate })

    start = format(
      addDays(parse(start, "yyyy-MM-dd", new Date()), 1),
      "yyyy-MM-dd",
    )
    endDate = format(
      addDays(parse(endDate, "yyyy-MM-dd", new Date()), 1),
      "yyyy-MM-dd",
    )
  }
}

executar()
