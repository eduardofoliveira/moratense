import "dotenv/config"
import { subDays, format, parse, addDays } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"

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
        if (
          eventoLastWeek &&
          Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) &&
          Number.parseInt(evento.totalTimeSeconds, 10)
        ) {
          if (evento.code === 1255) {
            // somente na Ineria se o numero da semana passada for maior que o atual é positivo
            if (
              Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) >
              Number.parseInt(evento.totalTimeSeconds, 10)
            ) {
              progressoTempo = `-${((Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) / Number.parseInt(evento.totalTimeSeconds, 10)) * 100).toFixed(0)}%`
            } else {
              progressoTempo = `${((Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) / Number.parseInt(evento.totalTimeSeconds, 10)) * 100).toFixed(0)}%`
            }
          } else {
            if (
              Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) >
              Number.parseInt(evento.totalTimeSeconds, 10)
            ) {
              progressoTempo = `${((Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) / Number.parseInt(evento.totalTimeSeconds, 10)) * 100).toFixed(0)}%`
            } else {
              progressoTempo = `-${((Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) / Number.parseInt(evento.totalTimeSeconds, 10)) * 100).toFixed(0)}%`
            }
          }
        } else {
          progressoTempo = "0%"
        }

        const mkbe = (distanceKilometers / evento.totalOccurances).toFixed(2)
        let progressoMkbe = ""
        if (Number.parseFloat(mkbeLastWeek) && Number.parseFloat(mkbe)) {
          if (evento.code === 1255) {
            // somente na Ineria se o numero da semana passada for maior que o atual é positivo
            if (Number.parseFloat(mkbeLastWeek) < Number.parseFloat(mkbe)) {
              progressoMkbe = `${((Number.parseFloat(mkbeLastWeek) / Number.parseFloat(mkbe)) * 100).toFixed(0)}%`
            } else {
              progressoMkbe = `-${((Number.parseFloat(mkbeLastWeek) / Number.parseFloat(mkbe)) * 100).toFixed(0)}%`
            }
          } else {
            if (Number.parseFloat(mkbeLastWeek) > Number.parseFloat(mkbe)) {
              progressoMkbe = `${((Number.parseFloat(mkbeLastWeek) / Number.parseFloat(mkbe)) * 100).toFixed(0)}%`
            } else {
              progressoMkbe = `-${((Number.parseFloat(mkbeLastWeek) / Number.parseFloat(mkbe)) * 100).toFixed(0)}%`
            }
          }
        } else {
          progressoMkbe = "0%"
        }
        const porcentagem = (
          (evento.totalTimeSeconds / duracao_viagens_segundos) *
          100
        ).toFixed(2)

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
        if (lastTotalConsumo > totalConsumo) {
          insert.ranking_consumo_progresso = `${((lastTotalConsumo / totalConsumo) * 100).toFixed(0)}%`
        } else {
          insert.ranking_consumo_progresso = `-${((lastTotalConsumo / totalConsumo) * 100).toFixed(0)}%`
        }
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
        if (lastTotalSeguranca > totalSeguranca) {
          insert.ranking_seguranca_progresso = `${((lastTotalSeguranca / totalSeguranca) * 100).toFixed(0)}%`
        } else {
          insert.ranking_seguranca_progresso = `-${((lastTotalSeguranca / totalSeguranca) * 100).toFixed(0)}%`
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

      await dbMoratense("follow_up_driver").insert(insert)
    }
  }
}

const test = async () => {
  // const hoje = new Date()
  // const start = format(subDays(hoje, 7), "yyyy-MM-dd 00:00:00")
  // const end = format(subDays(hoje, 1), "yyyy-MM-dd 23:59:59")

  const start = "2025-03-24 03:00:00"
  const end = "2025-03-31 02:59:59"

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
      priority,
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
