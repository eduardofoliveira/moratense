import "dotenv/config"

import ApiMix from "./service/api.mix"
import showEmpresa from "./use-cases/empresa/showEmpresa"
import Db from "./database/connectionManager"
import DbH from "./database/connectionManagerHostgator"

const executar = async () => {
  const conn = Db.getConnection()
  const connHG = DbH.getConnection()

  const stream = connHG
    .select("*")
    .from("telemetria_eventos")
    .whereBetween("data_turno_tel", ["2025-01-15", "2025-01-15"])
    .stream()
    .on("finish", () => {
      console.log("Transferência concluída!")
    })

  const batchSize = 500 // Número de registros por batch
  let batch = []
  // Lê os dados do stream e insere em batches
  for await (const row of stream) {
    row.id = undefined
    batch.push(row)
    if (batch.length === batchSize) {
      stream.pause()
      await conn.batchInsert("telemetria_eventos", batch)
      batch = [] // Limpa o batch
      stream.resume()
    }
  }

  // Insere os registros restantes no batch
  if (batch.length > 0) {
    await conn.batchInsert("telemetria_eventos", batch)
  }

  conn.destroy()
  connHG.destroy()
  // ---------------------------------------------------------
  // const conn = Db.getConnection()
  // const [result] = await conn.raw(`
  //   SELECT
  //     c.nome,
  //     dm.nome,
  //     c.chapa,
  //     dm.codigo_motorista
  //   FROM
  //     colaboradores c,
  //     drank_tel_motoristas dm
  //   WHERE
  //     c.nome = dm.nome and
  //     dm.codigo_motorista != c.chapa
  // `)
  // let count = 0
  // for await (const item of result) {
  //   console.log(`Evento: ${count++}`)
  //   await conn.raw(`
  //     UPDATE
  //       colaboradores
  //     SET
  //       chapa = ${item.codigo_motorista}
  //     WHERE
  //       nome = '${item.nome}'
  //   `)
  // }
  // await conn.destroy()
}

// executar()

const fixAssets = async () => {
  const empresa = await showEmpresa({ id: 4 })

  const apiMix = ApiMix.getInstance()
  await apiMix.getToken()

  const carros = await apiMix.listaCarros({ groupId: empresa.mix_groupId })

  const conn = Db.getConnection()

  for await (const carro of carros) {
    const assetId = carro.AssetId.toString()

    if (Number.parseInt(carro.Description, 10) > 0) {
      await conn("telemetria_carros")
        .update({
          data_cadastro: new Date(),
          carro: Number.parseInt(carro.Description, 10),
        })
        .where("codigo_mix", assetId)
    }
  }

  await conn.destroy()
  console.log("FIM")
}

fixAssets()
