import "dotenv/config"
import { subDays, format, parse, addDays } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"

type InputParams = {
  start: string
  end: string
}

function calcularVariacaoPercentual(valorAnterior: number, valorAtual: number) {
  if (valorAnterior === 0) {
    return "Divisão por zero (valor anterior não pode ser zero)"
  }
  const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100
  return `${variacao.toFixed(2)}%` // Arredonda para 2 casas decimais
}

const gerarIndicadores = async ({ start, end }: InputParams) => {
  const startLastWeek = format(
    subDays(parse(start, "yyyy-MM-dd HH:mm:ss", new Date()), 7),
    "yyyy-MM-dd HH:mm:ss",
  )
  const endLastWeek = format(
    subDays(parse(end, "yyyy-MM-dd HH:mm:ss", new Date()), 7),
    "yyyy-MM-dd HH:mm:ss",
  )

  const connMoratense = DbMoratense.getConnection()
  const [monitores] = await connMoratense.raw(`
    SELECT
      chapa_monitor
    FROM
      follow_up f,
      follow_up_type t
    WHERE
      f.fk_id_follow_up_type = t.id and
      horario BETWEEN '${start}' AND '${end}'
    GROUP BY
      chapa_monitor
    ORDER BY
      chapa_monitor
  `)

  for await (const monitor of monitores) {
    const chapa_monitor = monitor.chapa_monitor

    const [[driverMonitor]] = await connMoratense.raw(`
      SELECT
        driverId
      FROM
        drivers d
      WHERE
        d.employeeNumber = ${chapa_monitor}
    `)

    if (!driverMonitor) {
      console.log(`Motorista não encontrado para chapa ${chapa_monitor}`)
      continue // Pula para o próximo monitor se o motorista não for encontrado
    }

    const driverIdMonitor = driverMonitor.driverId

    const [[sumarizacaoCorridasLastWeek]] = await connMoratense.raw(`
      SELECT
        sum(v.fuelUsedLitres) AS fuelUsedLitres,
        sum(v.distanceKilometers) AS distanceKilometers,
        sum(v.duracao_viagens_segundos) AS duracao_viagens_segundos
      FROM
        viagens_globus_processadas v
      WHERE
        v.driverId IN (
          SELECT
            distinct d.driverId
          FROM
            drivers d
          WHERE
            d.employeeNumber IN (
              SELECT
                f.chapa_motorista
              FROM
                follow_up f
              WHERE
                f.chapa_monitor = ${chapa_monitor} and
                f.horario BETWEEN '${start}' AND '${end}'
            )
        ) AND
        v.data_saida_garagem BETWEEN '${startLastWeek}' AND '${endLastWeek}'
    `)

    const [[sumarizacaoCorridas]] = await connMoratense.raw(`
      SELECT
        sum(v.fuelUsedLitres) AS fuelUsedLitres,
        sum(v.distanceKilometers) AS distanceKilometers,
        sum(v.duracao_viagens_segundos) AS duracao_viagens_segundos
      FROM
        viagens_globus_processadas v
      WHERE
        v.driverId IN (
          SELECT
            distinct d.driverId
          FROM
            drivers d
          WHERE
            d.employeeNumber IN (
              SELECT
                f.chapa_motorista
              FROM
                follow_up f
              WHERE
                f.chapa_monitor = ${chapa_monitor} and
                f.horario BETWEEN '${start}' AND '${end}'
            )
        ) AND
        v.data_saida_garagem BETWEEN '${start}' AND '${end}'
    `)

    const [eventosLastWeek] = await connMoratense.raw(`
      SELECT
          e.code,
          e.descricao_exibida,
          SUM(e.totalOccurances) AS totalOccurances,
          SUM(e.totalTimeSeconds) AS totalTimeSeconds,
          e.seguranca,
          e.consumo
      FROM
        viagens_globus_processadas v,
        eventos_viagens_globus_processadas e
      WHERE
        v.id = e.fk_id_viagens_globus_processadas and
        v.driverId IN (
          SELECT
            distinct d.driverId
          FROM
            drivers d
          WHERE
            d.employeeNumber IN (
              SELECT
                f.chapa_motorista
              FROM
                follow_up f
              WHERE
                f.chapa_monitor = ${chapa_monitor} and
                f.horario BETWEEN '${start}' AND '${end}'
            )
        ) and
        v.data_saida_garagem BETWEEN '${startLastWeek}' AND '${endLastWeek}'
      GROUP BY
        e.code
  `)

    const [eventos] = await connMoratense.raw(`
    SELECT
          e.code,
          e.descricao_exibida,
          SUM(e.totalOccurances) AS totalOccurances,
          SUM(e.totalTimeSeconds) AS totalTimeSeconds,
          e.seguranca,
          e.consumo
      FROM
        viagens_globus_processadas v,
        eventos_viagens_globus_processadas e
      WHERE
        v.id = e.fk_id_viagens_globus_processadas and
        v.driverId IN (
          SELECT
            distinct d.driverId
          FROM
            drivers d
          WHERE
            d.employeeNumber IN (
              SELECT
                f.chapa_motorista
              FROM
                follow_up f
              WHERE
                f.chapa_monitor = ${chapa_monitor} and
                f.horario BETWEEN '${start}' AND '${end}'
            )
        ) and
        v.data_saida_garagem BETWEEN '${start}' AND '${end}'
      GROUP BY
        e.code
  `)

    const [[quantidadeMotoristas]] = await connMoratense.raw(`
      SELECT
        count(distinct d.driverId) AS qtd_orientados,
        (SELECT COUNT(distinct chapa_motorista) FROM follow_up WHERE horario BETWEEN '${start}' AND '${end}') AS total
      FROM
        drivers d,
        viagens_globus_processadas v
      WHERE
        d.driverId = v.driverId and
        d.employeeNumber IN (
          SELECT
            f.chapa_motorista
          FROM
            follow_up f
          WHERE
            f.chapa_monitor = ${chapa_monitor} and
            f.horario BETWEEN '${start}' AND '${end}'
        )
    `)

    const { qtd_orientados, total } = quantidadeMotoristas
    const porcentagemMotoristas = `${((qtd_orientados / total) * 100).toFixed(2)}%`

    // const numerosEventos = eventos.map((evento: any) => evento.code)

    let lastTotalConsumo = 0
    let lastTotalSeguranca = 0
    let totalConsumo = 0
    let totalSeguranca = 0

    if (eventosLastWeek.length > 0) {
      eventosLastWeek
        .filter((e: any) => e.consumo === 1)
        .map((e: any) => {
          lastTotalConsumo += Number.parseInt(e.totalOccurances, 10)
        })

      eventosLastWeek
        .filter((e: any) => e.seguranca === 1)
        .map((e: any) => {
          lastTotalSeguranca += Number.parseInt(e.totalOccurances, 10)
        })
    }

    const insert: any = {}
    insert.follow_up_date = end.replace("02:59:59", "08:00:00")
    insert.monitorId = driverIdMonitor
    insert.motorista_porcentagem = porcentagemMotoristas
    insert.quantidade_motoristas = qtd_orientados

    insert.inercia_mkbe = 0
    insert.inercia_progresso = "0%"
    insert.inercia_progresso_mkbe = "0%"
    insert.inercia_porcentagem = "0%"
    insert.fora_faixa_verde_mkbe = 0
    insert.fora_faixa_verde_progresso = "0%"
    insert.fora_faixa_verde_progresso_mkbe = "0%"
    insert.fora_faixa_verde_porcentagem = "0%"
    insert.excesso_rotacao_mkbe = 0
    insert.excesso_rotacao_progresso = "0%"
    insert.excesso_rotacao_progresso_mkbe = 0
    insert.excesso_rotacao_porcentagem = "0%"
    insert.freada_brusca_mkbe = 0
    insert.freada_brusca_progresso = "0%"
    insert.freada_brusca_progresso_mkbe = "0%"
    insert.freada_brusca_porcentagem = "0%"
    insert.marcha_lenta_excessiva_mkbe = 0
    insert.marcha_lenta_excessiva_progresso = "0%"
    insert.aceleracao_brusca_mkbe = 0
    insert.aceleracao_brusca_progresso = "0%"
    insert.aceleracao_brusca_progresso_mkbe = "0%"
    insert.aceleracao_brusca_porcentagem = "0%"
    insert.curva_brusca_mkbe = 0
    insert.curva_brusca_progresso = "0%"
    insert.excesso_velocidade_mkbe = 0
    insert.excesso_velocidade_progresso = "0%"

    const {
      fuelUsedLitres: fuelUsedLitresLastWeek,
      distanceKilometers: distanceKilometersLastWeek,
      duracao_viagens_segundos: duracao_viagens_segundosLastWeek,
    } = sumarizacaoCorridasLastWeek

    const { fuelUsedLitres, distanceKilometers, duracao_viagens_segundos } =
      sumarizacaoCorridas
    for await (const evento of eventos) {
      const eventoLastWeek = eventosLastWeek.find(
        (e: any) => e.code === evento.code,
      )
      // const eventoAtual = eventos.find((e: any) => e.code === evento.code)

      // let mkbeLastWeek: any = "0"
      let progressoTempo = "0%"
      // if (distanceKilometersLastWeek && eventoLastWeek) {
      //   mkbeLastWeek =
      //     distanceKilometersLastWeek / eventoLastWeek.totalOccurances
      // } else {
      //   mkbeLastWeek = "0"
      // }

      // porcentagemLastWeek = `${(
      //   (eventoLastWeek.totalTimeSeconds /
      //     viagensLastWeek.duracao_viagens_segundos) *
      //     100
      // ).toFixed(2)}%`
      // porcentagem = `${((evento.totalTimeSeconds / duracao_viagens_segundos) * 100).toFixed(2)}%`

      let porcentagemLastWeek: any =
        eventoLastWeek.totalTimeSeconds /
        sumarizacaoCorridas.duracao_viagens_segundos
      let porcentagem: any = evento.totalTimeSeconds / duracao_viagens_segundos

      if (
        eventoLastWeek &&
        Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) &&
        Number.parseInt(evento.totalTimeSeconds, 10)
      ) {
        if (evento.code === 1255) {
          progressoTempo = calcularVariacaoPercentual(
            porcentagemLastWeek,
            porcentagem,
          )
        } else {
          progressoTempo = calcularVariacaoPercentual(
            porcentagemLastWeek,
            porcentagem,
          )

          if (progressoTempo.startsWith("-")) {
            progressoTempo = progressoTempo.replace("-", "+")
          } else {
            progressoTempo = `-${progressoTempo}`
          }
        }
      }

      let mkbe: any = distanceKilometers / evento.totalOccurances
      const mkbeLastWeek =
        distanceKilometersLastWeek / eventoLastWeek.totalOccurances

      let progressoMkbe = "0%"
      if (mkbeLastWeek && mkbe) {
        if (evento.code === 1255) {
          progressoMkbe = calcularVariacaoPercentual(mkbeLastWeek, mkbe)

          // Inverta o sinal para os demais eventos
          if (progressoMkbe.startsWith("-")) {
            progressoMkbe = progressoMkbe.replace("-", "+")
          } else {
            progressoMkbe = `-${progressoMkbe}`
          }
        } else {
          progressoMkbe = calcularVariacaoPercentual(mkbeLastWeek, mkbe)
        }
      }

      if (evento.consumo === 1) {
        totalConsumo += Number.parseInt(evento.totalOccurances, 10)
      }
      if (evento.seguranca === 1) {
        totalSeguranca += Number.parseInt(evento.totalOccurances, 10)
      }

      porcentagemLastWeek = `${(
        (eventoLastWeek.totalTimeSeconds / duracao_viagens_segundosLastWeek) *
          100
      ).toFixed(2)}%`
      porcentagem = `${((evento.totalTimeSeconds / duracao_viagens_segundos) * 100).toFixed(2)}%`
      mkbe = `${mkbe.toFixed(2)}`

      if (evento.code === 1255) {
        // (RT) Inércia M.Benz
        insert.inercia_mkbe = mkbe ?? 0
        insert.inercia_progresso = progressoTempo ?? "0%"
        insert.inercia_progresso_mkbe = progressoMkbe ?? "0%"
        insert.inercia_porcentagem = porcentagem ?? "0%"
      }
      if (evento.code === 1124) {
        // (RT) Fora da Faixa Verde
        insert.fora_faixa_verde_mkbe = mkbe ?? 0
        insert.fora_faixa_verde_progresso = progressoTempo ?? "0%"
        insert.fora_faixa_verde_progresso_mkbe = progressoMkbe ?? "0%"
        insert.fora_faixa_verde_porcentagem = porcentagem ?? "0%"
      }
      if (evento.code === 1250) {
        // (RT) Excesso de Rotação
        insert.excesso_rotacao_mkbe = mkbe ?? 0
        insert.excesso_rotacao_progresso = progressoTempo ?? "0%"
        insert.excesso_rotacao_progresso_mkbe = progressoMkbe ?? "0%"
        insert.excesso_rotacao_porcentagem = porcentagem ?? "0%"
      }
      if (evento.code === 1253) {
        // (RT) Freada Brusca
        insert.freada_brusca_mkbe = mkbe ?? 0
        insert.freada_brusca_progresso = progressoTempo ?? "0%"
        insert.freada_brusca_progresso_mkbe = progressoMkbe ?? "0%"
        insert.freada_brusca_porcentagem = porcentagem ?? "0%"
      }
      // Calcular o progresso com base no mbke
      if (evento.code === 1153) {
        // (RT) Marcha Lenta Excessiva
        insert.marcha_lenta_excessiva_mkbe = mkbe ?? 0
        insert.marcha_lenta_excessiva_progresso = progressoMkbe ?? "0%"
      }
      if (evento.code === 1156) {
        // (RT) Aceleração Brusca
        insert.aceleracao_brusca_mkbe = mkbe ?? 0
        insert.aceleracao_brusca_progresso = progressoTempo ?? "0%"
        insert.aceleracao_brusca_progresso_mkbe = progressoMkbe ?? "0%"
        insert.aceleracao_brusca_porcentagem = porcentagem ?? "0%"
      }
      if (evento.code === 1252) {
        // (RT) Curva Brusca
        insert.curva_brusca_mkbe = mkbe ?? 0
        insert.curva_brusca_progresso = progressoMkbe ?? "0%"
      }
      if (evento.code === 1136) {
        // (RT) Excesso de Velocidade
        insert.excesso_velocidade_mkbe = mkbe ?? 0
        insert.excesso_velocidade_progresso = progressoMkbe ?? "0%"
      }
    }

    if (lastTotalConsumo !== 0 && totalConsumo !== 0) {
      insert.ranking_consumo_mkbe =
        (distanceKilometers / totalConsumo).toFixed(2) ?? 0

      const mkbeConsumoLastWeek = distanceKilometersLastWeek / lastTotalConsumo
      const mkbeConsumo = distanceKilometers / totalConsumo

      const rankingProgressoConsumo = calcularVariacaoPercentual(
        mkbeConsumoLastWeek,
        mkbeConsumo,
      )

      insert.ranking_consumo_progresso = rankingProgressoConsumo
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
      const mkbeSegurancaLastWeek =
        distanceKilometersLastWeek / lastTotalSeguranca
      const mkbeSeguranca = distanceKilometers / totalSeguranca

      const rankingProgressoSeguranca = calcularVariacaoPercentual(
        mkbeSegurancaLastWeek,
        mkbeSeguranca,
      )

      insert.ranking_seguranca_progresso = rankingProgressoSeguranca

      // insert.ranking_seguranca_progresso = calcularVariacaoPercentual(
      //   lastTotalSeguranca,
      //   totalSeguranca,
      // )

      // if (insert.ranking_seguranca_progresso.startsWith("-")) {
      //   insert.ranking_seguranca_progresso =
      //     insert.ranking_seguranca_progresso.replace("-", "+")
      // } else {
      //   insert.ranking_seguranca_progresso = `-${insert.ranking_seguranca_progresso}`
      // }
    } else {
      insert.ranking_seguranca_progresso = "0%"
    }
    if (distanceKilometers !== 0 && totalSeguranca !== 0) {
      insert.ranking_seguranca_mkbe =
        (distanceKilometers / totalSeguranca).toFixed(2) ?? 0
    } else {
      insert.ranking_seguranca_mkbe = 0
    }

    await connMoratense("follow_up_monitor_geral").insert(insert)
  }
}

const execute = async () => {
  // const hoje = new Date()
  // const start = format(subDays(hoje, 7), "yyyy-MM-dd 00:00:00")
  // const end = format(subDays(hoje, 1), "yyyy-MM-dd 23:59:59")
  const start = "2025-04-07 03:00:00"
  const end = "2025-04-14 02:59:59"

  await gerarIndicadores({ start, end })
}

execute()
