import "dotenv/config"

import DbDev from "./database/connectionManagerDev"
import DbProd from "./database/connectionManagerHomeLab"

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

execute()
