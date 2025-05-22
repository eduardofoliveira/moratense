import "dotenv/config"
import { subDays, format, parse, addDays } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"

type IParamsGerar = {
  start: string
  end: string
  monitor: {
    chapa_monitor: number
    follow_up_type: string
    priority: number
  }
}

type IParamsBuscarCorridas = {
  start: string
  end: string
  motoristaId: string
}

type IParamsBuscarEventos = {
  start: string
  end: string
  driverId: string
  assetId: string
}

function calcularVariacaoPercentual(valorAnterior: number, valorAtual: number) {
  if (valorAnterior === 0) {
    return "Divisão por zero (valor anterior não pode ser zero)"
  }
  const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100
  return `${variacao.toFixed(2)}%` // Arredonda para 2 casas decimais
}

function sumWithPrecision(numbers: number[]): number {
  // Define a quantidade de casas decimais (3 no seu caso)
  const precision = 3
  const factor = 10 ** precision

  // Multiplica cada número pelo fator, soma e depois divide pelo fator
  const sum = numbers.reduce(
    (acc: number, num: number) => acc + Math.round(num * factor),
    0,
  )
  return sum / factor
}

const buscarDriverIdMonitor = async (monitorId: string) => {
  const connMoratense = DbMoratense.getConnection()
  const [listMotoristas] = await connMoratense.raw(`
    SELECT
      driverId
    FROM
      drivers
    WHERE
      employeeNumber = ${monitorId}
  `)

  if (listMotoristas.length === 0) {
    return false
  }

  return listMotoristas[0].driverId
}

const buscarEventos = async ({
  start,
  end,
  driverId,
  assetId,
}: IParamsBuscarEventos) => {
  const connMoratense = DbMoratense.getConnection()
  const [eventos] = await connMoratense.raw(`
      SELECT
        e.eventTypeId,
        e.driverId,
        e.assetId,
        sum(e.totalOccurances) AS totalOccurances,
        SUM(e.totalTimeSeconds) AS totalTimeSeconds,
        ec.code,
        ec.descricao_exibida
      FROM
        events e,
        events_converter ec
      WHERE
        e.eventTypeId = ec.eventTypeId and
        e.driverId = ${driverId} and
        e.assetId = ${assetId} and
        e.startDateTime BETWEEN '${format(new Date(start), "yyyy-MM:dd HH:mm:ss")}' AND '${format(new Date(end), "yyyy-MM:dd HH:mm:ss")}'
      GROUP BY
        e.eventTypeId
  `)

  return eventos
}

const buscarCorridas = async ({
  start,
  end,
  motoristaId,
}: IParamsBuscarCorridas) => {
  const connMoratense = DbMoratense.getConnection()
  const [corridas] = await connMoratense.raw(`
    SELECT
      *
    FROM
      trips
    WHERE
      driverId = ${motoristaId} and
      tripStart BETWEEN '${start}' AND '${end}'
    order by
      tripStart
  `)

  return corridas
}

const gerar = async ({ start, end, monitor }: IParamsGerar) => {
  const startLastWeek = format(
    subDays(parse(start, "yyyy-MM-dd HH:mm:ss", new Date()), 7),
    "yyyy-MM-dd HH:mm:ss",
  )
  const endLastWeek = format(
    subDays(parse(end, "yyyy-MM-dd HH:mm:ss", new Date()), 7),
    "yyyy-MM-dd HH:mm:ss",
  )

  const connMoratense = DbMoratense.getConnection()
  const [[driverMonitor]] = await connMoratense.raw(`
    SELECT
      driverId
    FROM
      drivers d
    WHERE
      d.employeeNumber = ${monitor.chapa_monitor}
  `)

  if (!driverMonitor) {
    console.log(`Monitor ${monitor.chapa_monitor} não encontrado`)
    return
  }

  const followUpTypes = [2, 1]
  for await (const followUpType of followUpTypes) {
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
                f.chapa_monitor = ${monitor.chapa_monitor} and
                f.horario BETWEEN '${start}' AND '${end}' and
                f.fk_id_follow_up_type = ${followUpType}
            )
        ) and
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
                f.chapa_monitor = ${monitor.chapa_monitor} and
                f.horario BETWEEN '${start}' AND '${end}' and
                f.fk_id_follow_up_type = ${followUpType}
            )
        ) and
        v.data_saida_garagem BETWEEN '${start}' AND '${end}'
      GROUP BY
        c.numero_chassi
    `)

    if (sumarizacaoCorridas.length === 0) {
      continue
    }

    // const {
    //   fuelUsedLitres: fuelUsedLitresLastWeek,
    //   distanceKilometers: distanceKilometersLastWeek,
    //   duracao_viagens_segundos: duracao_viagens_segundosLastWeek,
    // } = sumarizacaoCorridasLastWeek

    // const { fuelUsedLitres, distanceKilometers, duracao_viagens_segundos } =
    //   sumarizacaoCorridas

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
                  f.chapa_monitor = ${monitor.chapa_monitor} and
                  f.horario BETWEEN '${start}' AND '${end}' and
                  f.fk_id_follow_up_type = ${followUpType}
              )
          ) and
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
                  f.chapa_monitor = ${monitor.chapa_monitor} and
                  f.horario BETWEEN '${start}' AND '${end}' and
                  f.fk_id_follow_up_type = ${followUpType}
              )
          ) and
          v.data_saida_garagem BETWEEN '${start}' AND '${end}'
        GROUP BY
          e.code,
          c.numero_chassi
    `)

    if (eventos.length === 0) {
      continue
    }

    const [quantidadeMotoristas] = await connMoratense.raw(`
      SELECT
        c.numero_chassi,
        count(distinct d.driverId) AS qtd_orientados,
        (SELECT COUNT(distinct chapa_motorista) FROM follow_up WHERE horario BETWEEN '${start}' AND '${end}') AS total
      FROM
        drivers d,
        viagens_globus_processadas v,
        chassi c
      WHERE
        d.driverId = v.driverId and
        c.id = v.fk_id_chassi and
        d.employeeNumber IN (
          SELECT
            f.chapa_motorista
          FROM
            follow_up f
          WHERE
            f.chapa_monitor = ${monitor.chapa_monitor} and
            f.horario BETWEEN '${start}' AND '${end}' and
            f.fk_id_follow_up_type = ${followUpType}
        )
      GROUP BY
        c.numero_chassi
    `)

    if (quantidadeMotoristas.length === 0) {
      continue
    }

    const { qtd_orientados, total } = quantidadeMotoristas[0]

    const listaChassis = new Set(
      eventos.map((e: any) => e.numero_chassi),
    ).values()
    for await (const chassiAtual of listaChassis) {
      const qtdOrientadoChassi = quantidadeMotoristas.find(
        (e: any) => e.numero_chassi === chassiAtual,
      )
      const porcentagemMotoristas = `${((qtdOrientadoChassi.qtd_orientados / total) * 100).toFixed(2)}%`

      let totalConsumo = 0
      let totalSeguranca = 0
      let lastTotalConsumo = 0
      let lastTotalSeguranca = 0
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
      insert.fk_id_follow_up_type = followUpType
      insert.follow_up_date = end.replace("02:59:59", "08:00:00")
      insert.monitorId = driverMonitor.driverId
      insert.motorista_porcentagem = porcentagemMotoristas
      insert.quantidade_motoristas = qtdOrientadoChassi.qtd_orientados

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
      insert.chassi = chassiAtual

      const eventosChassi = eventos.filter(
        (e: any) => e.numero_chassi === chassiAtual,
      )
      const eventosLastWeekChassi = eventosLastWeek.filter(
        (e: any) => e.numero_chassi === chassiAtual,
      )

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

      for await (const evento of eventosChassi) {
        const eventoLastWeek = eventosLastWeekChassi.find(
          (e: any) => e.code === evento.code,
        )

        if (!eventoLastWeek) {
          continue
        }

        let mkbeLastWeek: any = "0"
        let progressoTempo = "0%"
        if (distanceKilometersLastWeek && eventoLastWeek) {
          mkbeLastWeek =
            distanceKilometersLastWeek / eventoLastWeek.totalOccurances
        }

        let porcentagemLastWeek: any =
          eventoLastWeek.totalTimeSeconds / duracao_viagens_segundosLastWeek
        let porcentagem: any =
          evento.totalTimeSeconds / duracao_viagens_segundos

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

        porcentagemLastWeek = `${(
          (eventoLastWeek.totalTimeSeconds / duracao_viagens_segundosLastWeek) *
            100
        ).toFixed(2)}%`
        porcentagem = `${((evento.totalTimeSeconds / duracao_viagens_segundos) * 100).toFixed(2)}%`

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

        // const porcentagem = `${(
        //   (evento.totalTimeSeconds / duracao_viagens_segundos) * 100
        // ).toFixed(2)}%`

        if (evento.consumo === 1) {
          totalConsumo += Number.parseInt(evento.totalOccurances, 10)
        }
        if (evento.seguranca === 1) {
          totalSeguranca += Number.parseInt(evento.totalOccurances, 10)
        }

        mkbe = mkbe.toFixed(2)

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

      const exists = await connMoratense("follow_up_monitor")
        .select("*")
        .where({
          chassi: insert.chassi,
          monitorId: insert.monitorId,
          follow_up_date: insert.follow_up_date,
        })
        .first()
      if (!exists) {
        await connMoratense("follow_up_monitor").insert(insert)
      }
    }
  }
}

const execute = async () => {
  // const hoje = new Date()
  // const start = format(subDays(hoje, 7), "yyyy-MM-dd 00:00:00")
  // const end = format(subDays(hoje, 1), "yyyy-MM-dd 23:59:59")

  const start = "2025-05-12 03:00:00"
  const end = "2025-05-19 02:59:59"

  const connMoratense = DbMoratense.getConnection()
  const [listMonitores] = await connMoratense.raw(`
    SELECT
      t.id AS follow_up_type,
      chapa_monitor,
      MIN(t.priority) AS priority
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

  for await (const monitor of listMonitores) {
    await gerar({
      start,
      end,
      monitor,
    })
  }

  console.log("Processo finalizado com sucesso!")
}

execute()
