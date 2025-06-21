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
  const [motoristasNaoMonitorados] = await connMoratense.raw(`
    SELECT
      *
    FROM
      drivers
    WHERE
      driverId NOT IN (
        SELECT
          distinct d.driverId
        FROM
          follow_up f,
          drivers d
        WHERE
          f.chapa_motorista = d.employeeNumber and
          f.horario BETWEEN '${start}' AND '${end}'
      ) and
      employeeNumber > 0
  `)

  for await (const motorista of motoristasNaoMonitorados) {
    const { driverId, employeeNumber } = motorista
    const chapa = employeeNumber

    const [sumarizacaoCorridasLastWeek] = await connMoratense.raw(`
      SELECT
        c.numero_chassi,
        sum(v.fuelUsedLitres) AS fuelUsedLitres,
        sum(v.distanceKilometers) AS distanceKilometers,
        sum(v.duracao_viagens_segundos) AS duracao_viagens_segundos
      FROM
        viagens_globus_processadas v,
        chassi c
      WHERE
        v.fk_id_chassi = c.id and
        v.driverId = ${driverId} and
        v.data_saida_garagem BETWEEN '${startLastWeek}' AND '${endLastWeek}'
      GROUP BY
        c.numero_chassi
    `)

    if (sumarizacaoCorridasLastWeek.length === 0) {
      continue
    }

    const [sumarizacaoCorridas] = await connMoratense.raw(`
      SELECT
        c.numero_chassi,
        sum(v.fuelUsedLitres) AS fuelUsedLitres,
        sum(v.distanceKilometers) AS distanceKilometers,
        sum(v.duracao_viagens_segundos) AS duracao_viagens_segundos
      FROM
        viagens_globus_processadas v,
        chassi c
      WHERE
        v.fk_id_chassi = c.id and
        v.driverId = ${driverId} and
        v.data_saida_garagem BETWEEN '${start}' AND '${end}'
      GROUP BY
        c.numero_chassi
    `)

    if (sumarizacaoCorridas.length === 0) {
      continue
    }

    const [eventosLastWeek] = await connMoratense.raw(`
      SELECT
          c.numero_chassi,
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
        v.id = e.fk_id_viagens_globus_processadas and
        v.fk_id_chassi = c.id and
        v.driverId = ${driverId} and
        v.data_saida_garagem BETWEEN '${startLastWeek}' AND '${endLastWeek}'
      GROUP BY
        e.code,
        c.numero_chassi
    `)

    if (eventosLastWeek.length === 0) {
      continue
    }

    const [eventos] = await connMoratense.raw(`
      SELECT
        c.numero_chassi,
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
      v.id = e.fk_id_viagens_globus_processadas and
      v.fk_id_chassi = c.id and
      v.driverId = ${driverId} and
      v.data_saida_garagem BETWEEN '${start}' AND '${end}'
    GROUP BY
      e.code,
      c.numero_chassi
    `)

    if (eventos.length === 0) {
      continue
    }

    const listaChassis = new Set(
      eventos.map((e: any) => e.numero_chassi),
    ).values()

    for await (const chassiAtual of listaChassis) {
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

      insert.fk_id_follow_up_type = 5
      insert.follow_up_date = end.replace("02:59:59", "08:00:00")
      insert.driverId = driverId
      insert.monitorId = null
      insert.chassi = chassiAtual

      if (
        !sumarizacaoCorridasLastWeek.find(
          (c: any) => c.numero_chassi === chassiAtual,
        )
      ) {
        continue
      }

      const {
        fuelUsedLitres: fuelUsedLitresLastWeek,
        distanceKilometers: distanceKilometersLastWeek,
        duracao_viagens_segundos: duracao_viagens_segundosLastWeek,
      } = sumarizacaoCorridasLastWeek.find(
        (c: any) => c.numero_chassi === chassiAtual,
      )

      if (
        !sumarizacaoCorridas.find((c: any) => c.numero_chassi === chassiAtual)
      ) {
        continue
      }

      const { fuelUsedLitres, distanceKilometers, duracao_viagens_segundos } =
        sumarizacaoCorridas.find((c: any) => c.numero_chassi === chassiAtual)

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
        if (!eventoLastWeek) {
          continue
        }

        // const eventosLastWeekChassi = eventosLastWeek.filter(
        //   (e: any) => e.numero_chassi === chassiAtual,
        // )

        let porcentagemLastWeek: any =
          eventoLastWeek.totalTimeSeconds / duracao_viagens_segundosLastWeek
        let porcentagem: any =
          evento.totalTimeSeconds / duracao_viagens_segundos

        let mkbeLastWeek: any = "0"
        let progressoTempo = "0%"
        if (distanceKilometersLastWeek && eventoLastWeek) {
          mkbeLastWeek =
            distanceKilometersLastWeek / eventoLastWeek.totalOccurances
        }

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

        let progressoMkbe = "0%"
        if (mkbeLastWeek && mkbe) {
          if (evento.code === 1255) {
            progressoMkbe = calcularVariacaoPercentual(mkbeLastWeek, mkbe)

            if (progressoMkbe.startsWith("-")) {
              progressoMkbe = progressoMkbe.replace("-", "+")
            } else {
              progressoMkbe = `-${progressoMkbe}`
            }
          } else {
            progressoMkbe = calcularVariacaoPercentual(mkbeLastWeek, mkbe)
          }
        }

        porcentagemLastWeek = `${(
          (eventoLastWeek.totalTimeSeconds / duracao_viagens_segundosLastWeek) *
          100
        ).toFixed(2)}%`
        porcentagem = `${((evento.totalTimeSeconds / duracao_viagens_segundos) * 100).toFixed(2)}%`
        mkbe = mkbe.toFixed(2)

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

        const mkbeConsumoLastWeek =
          distanceKilometersLastWeek / lastTotalConsumo
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
      } else {
        insert.ranking_seguranca_progresso = "0%"
      }
      if (distanceKilometers !== 0 && totalSeguranca !== 0) {
        insert.ranking_seguranca_mkbe =
          (distanceKilometers / totalSeguranca).toFixed(2) ?? 0
      } else {
        insert.ranking_seguranca_mkbe = 0
      }

      insert.last_orientation = "0000-00-00 00:00:00"

      await connMoratense("follow_up_driver").insert(insert)
    }
  }
}

const execute = async () => {
  const hoje = new Date()
  const start = format(subDays(hoje, 8), "yyyy-MM-dd 03:00:00")
  const end = format(subDays(hoje, 1), "yyyy-MM-dd 02:59:59")

  // const start = "2025-06-09 03:00:00"
  // const end = "2025-06-16 02:59:59"

  await gerarIndicadores({
    start,
    end,
  })
}

execute()
  .catch((error) => {
    console.error("Erro ao executar o script:", error)
    process.exit(1)
  })
  .finally(() => {
    console.log("Finalizando o processo")
    process.exit(0)
  })
