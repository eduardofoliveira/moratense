import "dotenv/config"

import ApiMix from "./service/api.mix"
import showEmpresa from "./use-cases/empresa/showEmpresa"
import Db from "./database/connectionManager"
import DbH from "./database/connectionManagerHostgator"
import DbMoratense from "./database/connectionManagerHomeLab"

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

  const apiMix = await ApiMix.getInstance()
  // await apiMix.getToken()

  const carros = await apiMix.listaCarros({ groupId: empresa.mix_groupId })
  const conn = Db.getConnection()

  for await (const carro of carros) {
    const carroExists = await conn("telemetria_carros")
      .where({ codigo_mix: carro.AssetId.toString() })
      .first()

    if (!carroExists) {
      if (Number.parseInt(carro.Description, 10) > 0) {
        console.log("Inserindo carro")
        await conn("telemetria_carros").insert({
          id_empresa: 4,
          carro: Number.parseInt(carro.Description, 10),
          codigo_mix: carro.AssetId.toString(),
          data_cadastro: new Date(),
        })
      }
    }

    if (carroExists) {
      if (Number.parseInt(carro.Description, 10) > 0) {
        console.log("Atualizando carro")
        await conn("telemetria_carros")
          .update({
            // data_cadastro: new Date(),
            carro: Number.parseInt(carro.Description, 10),
          })
          .where("codigo_mix", carro.AssetId.toString())
      }
    }
  }

  await conn.destroy()
  console.log("FIM")
}

// fixAssets()

const fixColaboradoresLegado = async () => {
  try {
    const connTeleconsult = Db.getConnection()
    const connMoratense = DbMoratense.getConnection()

    // const funcionariosGlobus =
    //   await connMoratense("globus_funcionario").select("*")

    // for await (const funcionario of funcionariosGlobus) {
    //   const codigo = Number.parseInt(funcionario.codigo, 10)
    //   const chapa = Number.parseInt(funcionario.chapa, 10)

    //   await connTeleconsult.raw(`
    //     UPDATE
    //       colaboradores
    //     SET
    //       chapa = ${chapa},
    //       nome = '${funcionario.nome}'
    //     WHERE
    //       codigo = ${codigo} and
    //       id_empresa = 4
    //   `)
    // }
    // console.log(funcionariosGlobus)

    let [funcionariosDuplicados] = await connTeleconsult.raw(`SELECT
        codigo,
          COUNT(*) AS qtd
        FROM
          colaboradores
        WHERE
          id_empresa = 4
        GROUP BY
          codigo
        ORDER BY
          qtd desc
    `)

    funcionariosDuplicados = funcionariosDuplicados.filter(
      (item: any) => item.qtd > 1,
    )

    for await (const funcionario of funcionariosDuplicados) {
      const [funcionarios] = await connTeleconsult.raw(
        `SELECT * FROM colaboradores WHERE codigo = ${funcionario.codigo} and id_empresa = 4`,
      )
      console.log(funcionarios.length)

      for (let i = 0; i < funcionarios.length; i++) {
        if (i === 0) {
          continue
        }

        console.log("Removendo colaborador duplicado", funcionarios[i].id)
        await connTeleconsult.raw(`
          DELETE FROM colaboradores WHERE id = ${funcionarios[i].id}
        `)
      }
    }

    console.log("Corrigindo colaboradores legado")
  } catch (error) {
    console.log("Erro ao corrigir colaboradores legado", error)
  }
}

fixColaboradoresLegado()
