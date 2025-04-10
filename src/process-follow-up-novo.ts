import "dotenv/config"
import { subDays, format, parse, addDays } from "date-fns"
// import fs from "node:fs"
const Excel = require("exceljs")

const workbook = new Excel.Workbook()
const worksheet = workbook.addWorksheet("Relatorio", {
  views: [{ showGridLines: false }],
})

import DbMoratense from "./database/connectionManagerHomeLab"

// const arquivo = fs.createWriteStream("log.txt", { flags: "a" })
// const arquivo = fs.createWriteStream("relatorio.csv", { flags: "a" })

type ListProcessar = {
  fk_id_follow_up_type: string
  horario: string
  chapa_motorista: number
  driverId: string
  chapa_monitor: number
  monitorId: string
  driver: string
  monitor: string
  priority: number
}

type Params = {
  start: string
  end: string
  listaProcessar: ListProcessar[]
}

function calcularVariacaoPercentual(valorAnterior: number, valorAtual: number) {
  if (valorAnterior === 0) {
    return "Divisão por zero (valor anterior não pode ser zero)"
  }
  const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100
  return `${variacao.toFixed(2)}%` // Arredonda para 2 casas decimais
}

const execute = async ({ start, end, listaProcessar }: Params) => {
  const startLastWeek = format(
    subDays(parse(start, "yyyy-MM-dd HH:mm:ss", new Date()), 7),
    "yyyy-MM-dd HH:mm:ss",
  )
  const endLastWeek = format(
    subDays(parse(end, "yyyy-MM-dd HH:mm:ss", new Date()), 7),
    "yyyy-MM-dd HH:mm:ss",
  )

  let count = 0
  for await (const item of listaProcessar) {
    console.log(`Processando ${count} de ${listaProcessar.length}`)
    count++

    const dbMoratense = DbMoratense.getConnection()
    const [viagensChassi] = await dbMoratense.raw(`
      SELECT
        SUM(v.duracao_viagens_segundos) AS duracao_viagens_segundos,
        SUM(distanceKilometers) AS distanceKilometers,
        c.numero_chassi
      FROM
        viagens_globus_processadas v,
        chassi c
      WHERE
        v.fk_id_chassi = c.id and
        v.driverId = ${item.driverId} and
        v.data_saida_garagem BETWEEN '${start}' AND '${end}'
      GROUP BY
	      c.numero_chassi
    `)

    for await (const chassi of viagensChassi) {
      const [[viagensLastWeek]] = await dbMoratense.raw(`
        SELECT
          SUM(v.duracao_viagens_segundos) AS duracao_viagens_segundos,
          SUM(distanceKilometers) AS distanceKilometers,
          c.numero_chassi
        FROM
          viagens_globus_processadas v,
          chassi c
        WHERE
          v.fk_id_chassi = c.id and
          v.driverId = ${item.driverId} and
          v.data_saida_garagem BETWEEN '${startLastWeek}' AND '${endLastWeek}' and
          c.numero_chassi = ${chassi.numero_chassi}
        GROUP BY
          c.numero_chassi
      `)

      const duracao_viagens_segundos = chassi.duracao_viagens_segundos
      const distanceKilometers = chassi.distanceKilometers
      const numeroChassi = chassi.numero_chassi

      const [eventosLastWeek] = await dbMoratense.raw(`
        SELECT
          e.code,
          e.descricao_exibida,
          SUM(e.totalOccurances) AS totalOccurances,
          SUM(e.totalTimeSeconds) AS totalTimeSeconds,
          e.seguranca,
          e.consumo
        FROM
          viagens_globus_processadas v,
          eventos_viagens_globus_processadas e,
          chassi c
        WHERE
          v.fk_id_chassi = c.id and
          v.id = e.fk_id_viagens_globus_processadas and
          driverId = ${item.driverId} and
          data_saida_garagem BETWEEN '${startLastWeek}' AND '${endLastWeek}' and
          c.numero_chassi = ${numeroChassi}
        GROUP BY
          e.code
      `)

      const [eventos] = await dbMoratense.raw(`
        SELECT
          e.code,
          e.descricao_exibida,
          SUM(e.totalOccurances) AS totalOccurances,
          SUM(e.totalTimeSeconds) AS totalTimeSeconds,
          e.seguranca,
          e.consumo
        FROM
          viagens_globus_processadas v,
          eventos_viagens_globus_processadas e,
          chassi c
        WHERE
          v.fk_id_chassi = c.id and
          v.id = e.fk_id_viagens_globus_processadas and
          driverId = ${item.driverId} and
          data_saida_garagem BETWEEN '${start}' AND '${end}' and
          c.numero_chassi = ${numeroChassi}
        GROUP BY
          e.code
      `)

      const insert: any = {}
      insert.fora_faixa_verde_mkbe = 0
      insert.fora_faixa_verde_progresso = "0%"
      insert.fora_faixa_verde_porcentagem = 0
      insert.marcha_lenta_excessiva_mkbe = 0
      insert.marcha_lenta_excessiva_progresso = "0%"
      insert.aceleracao_brusca_mkbe = 0
      insert.aceleracao_brusca_progresso = "0%"
      insert.excesso_rotacao_mkbe = 0
      insert.excesso_rotacao_progresso = "0%"
      insert.excesso_rotacao_porcentagem = 0
      insert.curva_brusca_mkbe = 0
      insert.curva_brusca_progresso = "0%"
      insert.freada_brusca_mkbe = 0
      insert.freada_brusca_progresso = "0%"
      insert.inercia_mkbe = 0
      insert.inercia_progresso = "0%"
      insert.inercia_progresso_mkbe = 0
      insert.freada_brusca_porcentagem = 0
      insert.inercia_porcentagem = 0
      insert.excesso_velocidade_mkbe = 0
      insert.excesso_velocidade_progresso = "0%"
      insert.fora_faixa_verde_progresso_mkbe = 0
      insert.excesso_rotacao_progresso_mbke = 0
      insert.freada_brusca_progresso_mkbe = 0
      insert.aceleracao_brusca_progresso_mkbe = 0
      insert.aceleracao_brusca_porcentagem = 0

      insert.fk_id_follow_up_type = item.fk_id_follow_up_type
      insert.follow_up_date = end.replace("02:59:59", "08:00:00")
      insert.driverId = item.driverId
      insert.monitorId = item.monitorId
      insert.chassi = numeroChassi

      let lastTotalConsumo = 0
      let lastTotalSeguranca = 0
      let totalConsumo = 0
      let totalSeguranca = 0

      const dadosPlanilha: any = {}
      for await (const evento of eventos) {
        if (evento.consumo === 1) {
          totalConsumo += Number.parseInt(evento.totalOccurances, 10)
        }
        if (evento.seguranca === 1) {
          totalSeguranca += Number.parseInt(evento.totalOccurances, 10)
        }
        if (eventosLastWeek) {
          for await (const eventoLastWeek of eventosLastWeek) {
            if (eventoLastWeek.consumo === 1) {
              lastTotalConsumo += Number.parseInt(
                eventoLastWeek.totalOccurances,
                10,
              )
            }
            if (eventoLastWeek.seguranca === 1) {
              lastTotalSeguranca += Number.parseInt(
                eventoLastWeek.totalOccurances,
                10,
              )
            }
          }
        }

        const eventoLastWeek = eventosLastWeek.find(
          (e: any) => e.code === evento.code,
        )

        let mkbeLastWeek = ""
        let progressoTempo = ""
        if (viagensLastWeek && eventoLastWeek) {
          mkbeLastWeek = (
            viagensLastWeek.distanceKilometers / eventoLastWeek.totalOccurances
          ).toFixed(2)
        } else {
          mkbeLastWeek = "0"
        }

        if (viagensLastWeek && eventoLastWeek) {
          // arquivo.write("INICIO EVENTO\r\n")
          // arquivo.write(`${evento.code}\r\n`)
          // arquivo.write("mkbeLastWeek\r\n")
          // arquivo.write(
          //   `viagensLastWeek.distanceKilometers ${viagensLastWeek.distanceKilometers}\r\n`,
          // )
          // arquivo.write(
          //   `eventoLastWeek.totalOccurances ${eventoLastWeek.totalOccurances}\r\n`,
          // )
          // arquivo.write(`${mkbeLastWeek}\r\n`)
          // arquivo.write("\r\n")
          // console.log("INICIO EVENTO")
          // console.log(evento.code)
          // console.log("mkbeLastWeek")
          // console.log(
          //   "viagensLastWeek.distanceKilometers",
          //   viagensLastWeek.distanceKilometers,
          // )
          // console.log(
          //   "eventoLastWeek.totalOccurances",
          //   eventoLastWeek.totalOccurances,
          // )
          // console.log(mkbeLastWeek)
          // console.log("")
        }

        if (
          eventoLastWeek &&
          Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) &&
          Number.parseInt(evento.totalTimeSeconds, 10)
        ) {
          if (evento.code === 1255) {
            progressoTempo = calcularVariacaoPercentual(
              Number.parseInt(eventoLastWeek.totalTimeSeconds, 10),
              Number.parseInt(evento.totalTimeSeconds, 10),
            )
          } else {
            progressoTempo = calcularVariacaoPercentual(
              Number.parseInt(eventoLastWeek.totalTimeSeconds, 10),
              Number.parseInt(evento.totalTimeSeconds, 10),
            )

            // Inverta o sinal para os demais eventos
            if (progressoTempo.startsWith("-")) {
              progressoTempo = progressoTempo.replace("-", "+")
            } else {
              progressoTempo = `-${progressoTempo}`
            }
          }
        } else {
          progressoTempo = "0%"
        }

        if (
          eventoLastWeek &&
          Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) &&
          Number.parseInt(evento.totalTimeSeconds, 10)
        ) {
          // arquivo.write("progressoTempo\r\n")
          // arquivo.write(`eventoLastWeek ${eventoLastWeek.totalTimeSeconds}\r\n`)
          // arquivo.write(`evento ${evento.totalTimeSeconds}\r\n`)
          // arquivo.write(`${progressoTempo}\r\n`)
          // arquivo.write(`${progressoTempo}\r\n`)
          // arquivo.write("\r\n")
          // arquivo.write("mkbe\r\n")
          // arquivo.write(`distanceKilometers ${distanceKilometers}\r\n`)
          // arquivo.write(`totalOccurances ${evento.totalOccurances}\r\n`)
          // arquivo.write("\r\n")
          // console.log("progressoTempo")
          // console.log("eventoLastWeek", eventoLastWeek.totalTimeSeconds)
          // console.log("evento", evento.totalTimeSeconds)
          // console.log(progressoTempo)
          // console.log("")
          // console.log("mkbe")
          // console.log("distanceKilometers", distanceKilometers)
          // console.log("totalOccurances", evento.totalOccurances)
          // console.log("")
        }

        const mkbe = (distanceKilometers / evento.totalOccurances).toFixed(2)
        // arquivo.write(`mkbe ${mkbe}\r\n`)
        // console.log("mkbe", mkbe)

        let progressoMkbe = ""
        if (Number.parseFloat(mkbeLastWeek) && Number.parseFloat(mkbe)) {
          if (evento.code === 1255) {
            progressoMkbe = calcularVariacaoPercentual(
              Number.parseFloat(mkbeLastWeek),
              Number.parseFloat(mkbe),
            )
          } else {
            progressoMkbe = calcularVariacaoPercentual(
              Number.parseFloat(mkbeLastWeek),
              Number.parseFloat(mkbe),
            )

            // Inverta o sinal para os demais eventos
            if (progressoMkbe.startsWith("-")) {
              progressoMkbe = progressoMkbe.replace("-", "+")
            } else {
              progressoMkbe = `-${progressoMkbe}`
            }
          }
        } else {
          progressoMkbe = "0%"
        }

        // arquivo.write("progressoMkbe\r\n")
        // arquivo.write(`mkbeLastWeek ${mkbeLastWeek}\r\n`)
        // arquivo.write(`mkbe ${mkbe}\r\n`)
        // arquivo.write(`${progressoMkbe}\r\n`)
        // arquivo.write("\r\n")

        // console.log("progressoMkbe")
        // console.log("mkbeLastWeek", mkbeLastWeek)
        // console.log("mkbe", mkbe)
        // console.log(progressoMkbe)
        // console.log("")

        const porcentagem = (
          (evento.totalTimeSeconds / duracao_viagens_segundos) *
          100
        ).toFixed(2)

        dadosPlanilha[evento.code] = {
          totalOccurances: evento.totalOccurances,
          totalTimeSeconds: evento.totalTimeSeconds,
          mkbe: mkbe,
          progressoTempo,
          progressoMkbe,
          porcentagem,
        }

        if (evento.code === 1255) {
          // (RT) Inércia M.Benz
          insert.inercia_mkbe = mkbe ?? 0
          insert.inercia_progresso = progressoTempo ?? 0
          insert.inercia_progresso_mkbe = progressoMkbe ?? 0
          insert.inercia_porcentagem = porcentagem ?? 0
        }
        if (evento.code === 1124) {
          // (RT) Fora da Faixa Verde
          insert.fora_faixa_verde_mkbe = mkbe ?? 0
          insert.fora_faixa_verde_progresso = progressoTempo ?? 0
          insert.fora_faixa_verde_progresso_mkbe = progressoMkbe ?? 0
          insert.fora_faixa_verde_porcentagem = porcentagem ?? 0
        }
        if (evento.code === 1250) {
          // (RT) Excesso de Rotação
          insert.excesso_rotacao_mkbe = mkbe ?? 0
          insert.excesso_rotacao_progresso = progressoTempo ?? 0
          insert.excesso_rotacao_progresso_mbke = progressoMkbe ?? 0
          insert.excesso_rotacao_porcentagem = porcentagem ?? 0
        }
        if (evento.code === 1253) {
          // (RT) Freada Brusca
          insert.freada_brusca_mkbe = mkbe ?? 0
          insert.freada_brusca_progresso = progressoTempo ?? 0
          insert.freada_brusca_progresso_mkbe = progressoMkbe ?? 0
          insert.freada_brusca_porcentagem = porcentagem ?? 0
        }
        // Calcular o progresso com base no mbke
        if (evento.code === 1153) {
          // (RT) Marcha Lenta Excessiva
          insert.marcha_lenta_excessiva_mkbe = mkbe ?? 0
          insert.marcha_lenta_excessiva_progresso = progressoMkbe ?? 0
        }
        if (evento.code === 1156) {
          // (RT) Aceleração Brusca
          insert.aceleracao_brusca_mkbe = mkbe ?? 0
          insert.aceleracao_brusca_progresso = progressoTempo ?? 0
          insert.aceleracao_brusca_progresso_mkbe = progressoMkbe ?? 0
          insert.aceleracao_brusca_porcentagem = porcentagem ?? 0
        }
        if (evento.code === 1252) {
          // (RT) Curva Brusca
          insert.curva_brusca_mkbe = mkbe ?? 0
          insert.curva_brusca_progresso = progressoMkbe ?? 0
        }
        if (evento.code === 1136) {
          // (RT) Excesso de Velocidade
          insert.excesso_velocidade_mkbe = mkbe ?? 0
          insert.excesso_velocidade_progresso = progressoMkbe ?? 0
        }
      }

      if (lastTotalConsumo !== 0 && totalConsumo !== 0) {
        insert.ranking_consumo_mkbe =
          (distanceKilometers / totalConsumo).toFixed(2) ?? 0
        insert.ranking_consumo_progresso = calcularVariacaoPercentual(
          lastTotalConsumo,
          totalConsumo,
        )
      } else {
        insert.ranking_consumo_progresso = "0%"
      }
      if (distanceKilometers !== 0 && totalConsumo !== 0) {
        insert.ranking_consumo_mkbe =
          (distanceKilometers / totalConsumo).toFixed(2) ?? 0
      } else {
        insert.ranking_consumo_mkbe = 0
      }
      if (lastTotalSeguranca !== 0 && totalSeguranca !== 0) {
        insert.ranking_seguranca_progresso = calcularVariacaoPercentual(
          lastTotalSeguranca,
          totalSeguranca,
        )

        if (insert.ranking_seguranca_progresso.startsWith("-")) {
          insert.ranking_seguranca_progresso =
            insert.ranking_seguranca_progresso.replace("-", "+")
        } else {
          insert.ranking_seguranca_progresso = `-${insert.ranking_seguranca_progresso}`
        }
      } else {
        insert.ranking_seguranca_progresso = "0%"
      }
      if (distanceKilometers !== 0 && totalSeguranca !== 0) {
        insert.ranking_seguranca_mkbe =
          (distanceKilometers / totalSeguranca).toFixed(2) ?? 0
      } else {
        insert.ranking_seguranca_mkbe = 0
      }

      const [[lastOrientation]] = await dbMoratense.raw(`
        SELECT
          horario
        FROM
          follow_up
        WHERE
          chapa_motorista = ${item.chapa_motorista} and
          chapa_monitor = ${item.chapa_monitor}
        ORDER BY
          horario desc
        LIMIT 1
      `)

      insert.last_orientation = format(
        new Date(lastOrientation.horario),
        "yyyy-MM-dd HH:mm:ss",
      )

      // Define columns in the worksheet, these columns are identified using a key.
      worksheet.columns = [
        { header: "distanceKilometers", key: "distanceKilometers", width: 25 },
        { header: "lastTotalConsumo", key: "lastTotalConsumo", width: 20 },
        { header: "totalConsumo", key: "totalConsumo", width: 25 },
        { header: "lastTotalSeguranca", key: "lastTotalSeguranca", width: 20 },
        { header: "totalSeguranca", key: "totalSeguranca", width: 20 },

        { header: "1255-name", key: "1255-name", width: 20 },
        {
          header: "1255-totalOccurances",
          key: "1255-totalOccurances",
          width: 20,
        },
        {
          header: "1255-totalTimeSeconds",
          key: "1255-totalTimeSeconds",
          width: 20,
        },
        { header: "1255-mkbe", key: "1255-mkbe", width: 20 },
        {
          header: "1255-progressoTempo",
          key: "1255-progressoTempo",
          width: 20,
        },
        { header: "1255-progressoMkbe", key: "1255-progressoMkbe", width: 20 },
        { header: "1255-porcentagem", key: "1255-porcentagem", width: 20 },

        { header: "1124-name", key: "1124-name", width: 20 },
        {
          header: "1124-totalOccurances",
          key: "1124-totalOccurances",
          width: 20,
        },
        {
          header: "1124-totalTimeSeconds",
          key: "1124-totalTimeSeconds",
          width: 20,
        },
        { header: "1124-mkbe", key: "1124-mkbe", width: 20 },
        {
          header: "1124-progressoTempo",
          key: "1124-progressoTempo",
          width: 20,
        },
        { header: "1124-progressoMkbe", key: "1124-progressoMkbe", width: 20 },
        { header: "1124-porcentagem", key: "1124-porcentagem", width: 20 },

        { header: "1250-name", key: "1250-name", width: 20 },
        {
          header: "1250-totalOccurances",
          key: "1250-totalOccurances",
          width: 20,
        },
        {
          header: "1250-totalTimeSeconds",
          key: "1250-totalTimeSeconds",
          width: 20,
        },
        { header: "1250-mkbe", key: "1250-mkbe", width: 20 },
        {
          header: "1250-progressoTempo",
          key: "1250-progressoTempo",
          width: 20,
        },
        { header: "1250-progressoMkbe", key: "1250-progressoMkbe", width: 20 },
        { header: "1250-porcentagem", key: "1250-porcentagem", width: 20 },

        { header: "1253-name", key: "1253-name", width: 20 },
        {
          header: "1253-totalOccurances",
          key: "1253-totalOccurances",
          width: 20,
        },
        {
          header: "1253-totalTimeSeconds",
          key: "1253-totalTimeSeconds",
          width: 20,
        },
        { header: "1253-mkbe", key: "1253-mkbe", width: 20 },
        {
          header: "1253-progressoTempo",
          key: "1253-progressoTempo",
          width: 20,
        },
        { header: "1253-progressoMkbe", key: "1253-progressoMkbe", width: 20 },
        { header: "1253-porcentagem", key: "1253-porcentagem", width: 20 },

        { header: "1156-name", key: "1156-name", width: 20 },
        {
          header: "1156-totalOccurances",
          key: "1156-totalOccurances",
          width: 20,
        },
        {
          header: "1156-totalTimeSeconds",
          key: "1156-totalTimeSeconds",
          width: 20,
        },
        { header: "1156-mkbe", key: "1156-mkbe", width: 20 },
        {
          header: "1156-progressoTempo",
          key: "1156-progressoTempo",
          width: 20,
        },
        { header: "1156-progressoMkbe", key: "1156-progressoMkbe", width: 20 },
        { header: "1156-porcentagem", key: "1156-porcentagem", width: 20 },

        { header: "1252-name", key: "1252-name", width: 20 },
        {
          header: "1252-totalOccurances",
          key: "1252-totalOccurances",
          width: 20,
        },
        {
          header: "1252-totalTimeSeconds",
          key: "1252-totalTimeSeconds",
          width: 20,
        },
        { header: "1252-mkbe", key: "1252-mkbe", width: 20 },
        {
          header: "1252-progressoTempo",
          key: "1252-progressoTempo",
          width: 20,
        },
        { header: "1252-progressoMkbe", key: "1252-progressoMkbe", width: 20 },
        { header: "1252-porcentagem", key: "1252-porcentagem", width: 20 },

        { header: "1136-name", key: "1136-name", width: 20 },
        {
          header: "1136-totalOccurances",
          key: "1136-totalOccurances",
          width: 20,
        },
        {
          header: "1136-totalTimeSeconds",
          key: "1136-totalTimeSeconds",
          width: 20,
        },
        { header: "1136-mkbe", key: "1136-mkbe", width: 20 },
        {
          header: "1136-progressoTempo",
          key: "1136-progressoTempo",
          width: 20,
        },
        { header: "1136-progressoMkbe", key: "1136-progressoMkbe", width: 20 },
        { header: "1136-porcentagem", key: "1136-porcentagem", width: 20 },
      ]

      worksheet.addRow({
        distanceKilometers,
        lastTotalConsumo,
        totalConsumo,
        lastTotalSeguranca,
        totalSeguranca,
        "1255-name": "Inércia",
        "1255-totalOccurances": dadosPlanilha[1255]?.totalOccurances ?? 0,
        "1255-totalTimeSeconds": dadosPlanilha[1255]?.totalTimeSeconds ?? 0,
        "1255-mkbe": dadosPlanilha[1255]?.mkbe ?? 0,
        "1255-progressoTempo": dadosPlanilha[1255]?.progressoTempo ?? "0%",
        "1255-progressoMkbe": dadosPlanilha[1255]?.progressoMkbe ?? "0%",
        "1255-porcentagem": dadosPlanilha[1255]?.porcentagem ?? 0,

        "1124-name": "Fora da Faixa Verde",
        "1124-totalOccurances": dadosPlanilha[1124]?.totalOccurances ?? 0,
        "1124-totalTimeSeconds": dadosPlanilha[1124]?.totalTimeSeconds ?? 0,
        "1124-mkbe": dadosPlanilha[1124]?.mkbe ?? 0,
        "1124-progressoTempo": dadosPlanilha[1124]?.progressoTempo ?? "0%",
        "1124-progressoMkbe": dadosPlanilha[1124]?.progressoMkbe ?? "0%",
        "1124-porcentagem": dadosPlanilha[1124]?.porcentagem ?? 0,

        "1250-name": "Excesso de Rotação",
        "1250-totalOccurances": dadosPlanilha[1250]?.totalOccurances ?? 0,
        "1250-totalTimeSeconds": dadosPlanilha[1250]?.totalTimeSeconds ?? 0,

        "1250-mkbe": dadosPlanilha[1250]?.mkbe ?? 0,
        "1250-progressoTempo": dadosPlanilha[1250]?.progressoTempo ?? "0%",
        "1250-progressoMkbe": dadosPlanilha[1250]?.progressoMkbe ?? "0%",
        "1250-porcentagem": dadosPlanilha[1250]?.porcentagem ?? 0,

        "1253-name": "Freada Brusca",
        "1253-totalOccurances": dadosPlanilha[1253]?.totalOccurances ?? 0,
        "1253-totalTimeSeconds": dadosPlanilha[1253]?.totalTimeSeconds ?? 0,
        "1253-mkbe": dadosPlanilha[1253]?.mkbe ?? 0,
        "1253-progressoTempo": dadosPlanilha[1253]?.progressoTempo ?? "0%",
        "1253-progressoMkbe": dadosPlanilha[1253]?.progressoMkbe ?? "0%",
        "1253-porcentagem": dadosPlanilha[1253]?.porcentagem ?? 0,

        "1156-name": "Aceleração Brusca",
        "1156-totalOccurances": dadosPlanilha[1156]?.totalOccurances ?? 0,
        "1156-totalTimeSeconds": dadosPlanilha[1156]?.totalTimeSeconds ?? 0,
        "1156-mkbe": dadosPlanilha[1156]?.mkbe ?? 0,
        "1156-progressoTempo": dadosPlanilha[1156]?.progressoTempo ?? "0%",
        "1156-progressoMkbe": dadosPlanilha[1156]?.progressoMkbe ?? "0%",
        "1156-porcentagem": dadosPlanilha[1156]?.porcentagem ?? 0,

        "1252-name": "Curva Brusca",
        "1252-totalOccurances": dadosPlanilha[1252]?.totalOccurances ?? 0,
        "1252-totalTimeSeconds": dadosPlanilha[1252]?.totalTimeSeconds ?? 0,
        "1252-mkbe": dadosPlanilha[1252]?.mkbe ?? 0,
        "1252-progressoTempo": dadosPlanilha[1252]?.progressoTempo ?? "0%",
        "1252-progressoMkbe": dadosPlanilha[1252]?.progressoMkbe ?? "0%",
        "1252-porcentagem": dadosPlanilha[1252]?.porcentagem ?? 0,

        "1136-name": "Excesso de Velocidade",
        "1136-totalOccurances": dadosPlanilha[1136]?.totalOccurances ?? 0,
        "1136-totalTimeSeconds": dadosPlanilha[1136]?.totalTimeSeconds ?? 0,
        "1136-mkbe": dadosPlanilha[1136]?.mkbe ?? 0,
        "1136-progressoTempo": dadosPlanilha[1136]?.progressoTempo ?? "0%",
        "1136-progressoMkbe": dadosPlanilha[1136]?.progressoMkbe ?? "0%",
        "1136-porcentagem": dadosPlanilha[1136]?.porcentagem ?? 0,
      })

      await workbook.xlsx.writeFile("relatorio-follow-up.xlsx")

      // Add a row to the worksheet using the data from the object.

      // await dbMoratense("follow_up_driver").insert(insert)
    }
  }
}

const test = async () => {
  // const hoje = new Date()
  // const start = format(subDays(hoje, 7), "yyyy-MM-dd 00:00:00")
  // const end = format(subDays(hoje, 1), "yyyy-MM-dd 23:59:59")

  const start = "2025-03-31 03:00:00"
  const end = "2025-04-07 02:59:59"

  const connMoratense = DbMoratense.getConnection()
  const [listaProcessar] = await connMoratense.raw(`
    SELECT
      min(f.fk_id_follow_up_type) AS fk_id_follow_up_type,
      max(f.horario) AS horario,
      f.chapa_motorista,
      d.driverId AS driverId,
      f.chapa_monitor,
      m.driverId AS monitorId,
      d.name AS driver,
      m.name AS monitor,
      min(ft.priority) AS priority
    FROM
      follow_up f,
      drivers d,
      drivers m,
      follow_up_type ft
    WHERE
      f.chapa_motorista = d.employeeNumber and
      f.chapa_monitor = m.employeeNumber and
      f.fk_id_follow_up_type = ft.id and
      horario BETWEEN '${start}' AND '${end}' and
      f.processado = 0
    GROUP BY
      f.chapa_motorista,
      f.chapa_monitor
  `)

  await execute({
    start,
    end,
    listaProcessar,
  })
}

test()
