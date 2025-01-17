import "dotenv/config"

import Db from "./database/connectionManager"
import DbH from "./database/connectionManagerHostgator"

const executar = async () => {
  const conn = Db.getConnection()
  const connHG = DbH.getConnection()

  const stream = connHG
    .select("*")
    .from("drank_tel_eventos")
    .whereBetween("data_turno_tel", ["2025-01-11", "2025-01-12"])
    .stream()
    .on("finish", () => {
      console.log("Transferência concluída!")
    })

  // const insertBatch = async (rows: any) => {
  //   console.log("inserindo")

  //   // Insere os dados na conexão de destino
  //   await conn.batchInsert("drank_tel_eventos", rows)
  // }

  const batchSize = 500 // Número de registros por batch
  let batch = []

  // Lê os dados do stream e insere em batches
  for await (const row of stream) {
    row.id = undefined

    batch.push(row)
    if (batch.length === batchSize) {
      stream.pause()
      await conn.batchInsert("drank_tel_eventos", batch)
      batch = [] // Limpa o batch
      stream.resume()
    }
  }

  // Insere os registros restantes no batch
  if (batch.length > 0) {
    await conn.batchInsert("drank_tel_eventos", batch)
  }

  // conn.destroy()
  // connHG.destroy()

  // const conn = Db.getConnection()
  // const [result] = await conn.raw(`
  //   SELECT
  // 		a.id_drank_tel_eventos
  // 	FROM
  // 		aux_eventos a
  // 	where
  // 		a.event_type_id IN (-3021016551627388635, -8571486384802428876)
  // 	ORDER BY
  // 		created_at DESC
  // `)
  // let count = 0
  // for await (const item of result) {
  //   console.log(`Evento: ${count++}`)
  //   conn.raw(`
  //     UPDATE
  //       teleconsult.drank_tel_eventos de
  //     SET
  //       de.id_tipo = 1295
  //     where
  //       de.id = ${item.id_drank_tel_eventos}
  //   `)
  //   conn.raw(`
  //     UPDATE
  //       teleconsult_api.drank_tel_eventos de
  //     SET
  //       de.id_tipo = 1295
  //     where
  //       de.id = ${item.id_drank_tel_eventos}
  //   `)
  //   await conn.raw(`
  //     UPDATE
  //       teleconsult_app.drank_tel_eventos de
  //     SET
  //       de.id_tipo = 1295
  //     where
  //       de.id = ${item.id_drank_tel_eventos}
  //   `)
  // }
  // await conn.destroy()
}

executar()
