import "dotenv/config"

import DbDev from "./database/connectionManagerDev"
import DbProd from "./database/connectionManagerHomeLab"

const sumarizarEventosPorViagensProcessadasGlobus = async () => {
  return new Promise(async (resolve, reject): Promise<void> => {
    try {
      const db =
        process.env.ENV === "production"
          ? DbProd.getConnection()
          : DbDev.getConnection()

      const eventosConverter = await db("events_converter").select("*")

      const processarQuantidadeEventos = await db("viagens_globus_processadas")
        .select("*")
        .where("eventos_processados", 1)
        .andWhereBetween(
          "data_saida_garagem",
          ["2025-06-01 00:00:00", "2025-06-30 23:59:59"],)

      const total = processarQuantidadeEventos.length
      let atual = 0
      let progress = (atual / total) * 100

      for await (const viagemGlobus of processarQuantidadeEventos) {
        console.log(`progresso - ${progress.toFixed(2)}%`)
        atual++
        progress = (atual / total) * 100

        const tripsIds = viagemGlobus.tripsIds
          .split(",")
          .map((tripId: string) => tripId.trim())

        const sumarizarPorCode: any[] = []

        for await (const tripId of tripsIds) {
          let [eventosViagem] = await db.raw(`
              SELECT
                e.eventTypeId,
                sum(e.totalOccurances) AS totalOccurances,
                sum(e.totalTimeSeconds) AS totalTimeSeconds
              FROM
                trips t,
                events e
              WHERE
                e.assetId = t.assetId and
                e.startDateTime BETWEEN t.tripStart AND t.tripEnd and
                tripId = ${tripId}
              GROUP BY
                e.eventTypeId
          `)

          eventosViagem = eventosViagem.map((evento: any) => {
            const eventoConverter = eventosConverter.find(
              (ec: any) => ec.eventTypeId === evento.eventTypeId,
            )

            return {
              ...evento,
              code: eventoConverter ? eventoConverter.code : null,
            }
          })

          for await (const evento of eventosViagem) {
            const { code, totalOccurances, totalTimeSeconds } = evento

            if (code) {
              const eventoExistente = sumarizarPorCode.find(
                (e: any) => e.code === code,
              )

              if (eventoExistente) {
                eventoExistente.totalOccurances +=
                  Number.parseInt(totalOccurances)
                eventoExistente.totalTimeSeconds +=
                  Number.parseInt(totalTimeSeconds)
              } else {
                sumarizarPorCode.push({
                  code,
                  totalOccurances: Number.parseInt(totalOccurances),
                  totalTimeSeconds: Number.parseInt(totalTimeSeconds),
                })
              }
            }
          }
        }

        for await (const evento of sumarizarPorCode) {
          await db("viagens_globus_processadas")
            .update({
              [`event_${evento.code}`]: evento.totalOccurances,
              [`event_${evento.code}_time`]: evento.totalTimeSeconds,
            })
            .where("id", viagemGlobus.id)
        }

        await db("viagens_globus_processadas")
          .update({
            eventos_processados: 2,
          })
          .where("id", viagemGlobus.id)
      }

      console.log("Processamento concluído com sucesso!")
      process.exit(0)
      resolve(null)
    } catch (error) {
      reject(error)
    }
  })
}

const execute = async () => {
  const db =
    process.env.ENV === "production"
      ? DbProd.getConnection()
      : DbDev.getConnection()

  const processarQuantidadeEventos = await db("viagens_globus_processadas")
    .select("*")
    .where("eventos_processados", 1)

  const total = processarQuantidadeEventos.length
  let atual = 0
  let progress = (atual / total) * 100

  for await (const viagemGlobus of processarQuantidadeEventos) {
    console.log(`progresso - ${progress.toFixed(2)}%`)
    atual++
    progress = (atual / total) * 100

    const eventos = await db("eventos_viagens_globus_processadas").where(
      "fk_id_viagens_globus_processadas",
      viagemGlobus.id,
    )

    for await (const evento of eventos) {
      const {
        fk_id_viagens_globus_processadas,
        code,
        totalOccurances,
        totalTimeSeconds,
      } = evento

      await db("viagens_globus_processadas")
        .update({
          [`event_${code}`]: totalOccurances ? totalOccurances : 0,
          [`event_${code}_time`]: totalTimeSeconds ? totalTimeSeconds : 0,
        })
        .where("id", fk_id_viagens_globus_processadas)
    }

    await db("viagens_globus_processadas")
      .update({
        eventos_processados: 2,
      })
      .where("id", viagemGlobus.id)
  }
}

sumarizarEventosPorViagensProcessadasGlobus()
// execute()
