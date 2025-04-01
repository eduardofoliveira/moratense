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
              f.chapa_monitor = ${monitor.chapa_monitor} and
              f.horario BETWEEN '${start}' AND '${end}'
          )
      ) and
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
              f.chapa_monitor = ${monitor.chapa_monitor} and
              f.horario BETWEEN '${start}' AND '${end}'
          )
      ) and
      v.data_saida_garagem BETWEEN '${start}' AND '${end}'
  `)

  const {
    fuelUsedLitres: fuelUsedLitresLastWeek,
    distanceKilometers: distanceKilometersLastWeek,
    duracao_viagens_segundos: duracao_viagens_segundosLastWeek,
  } = sumarizacaoCorridasLastWeek

  const { fuelUsedLitres, distanceKilometers, duracao_viagens_segundos } =
    sumarizacaoCorridas

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
                f.chapa_monitor = ${monitor.chapa_monitor} and
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
                f.chapa_monitor = ${monitor.chapa_monitor} and
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
      (SELECT COUNT(*) FROM drivers) AS total
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
          f.horario BETWEEN '${start}' AND '${end}'
      )
  `)

  const { qtd_orientados, total } = quantidadeMotoristas
  const porcentagemMotoristas = `${((quantidadeMotoristas.qtd_orientados / total) * 100).toFixed(2)}%`

  let totalConsumo = 0
  let totalSeguranca = 0
  const insert: any = {}
  insert.fk_id_follow_up_type = monitor.follow_up_type
  insert.follow_up_date = start.replace("03:00:00", "08:00:00")
  insert.monitorId = driverMonitor.driverId
  insert.motorista_porcentagem = porcentagemMotoristas

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

  for await (const evento of eventos) {
    console.log(evento)

    const eventoLastWeek = eventosLastWeek.find(
      (e: any) => e.code === evento.code,
    )

    let mkbeLastWeek = "0"
    let progressoTempo = "0%"
    if (distanceKilometersLastWeek && eventoLastWeek) {
      mkbeLastWeek = (
        distanceKilometersLastWeek / eventoLastWeek.totalOccurances
      ).toFixed(2)
    } else {
      mkbeLastWeek = "0"
    }
    if (
      eventoLastWeek &&
      Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) &&
      Number.parseInt(evento.totalTimeSeconds, 10)
    ) {
      progressoTempo = `${((Number.parseInt(eventoLastWeek.totalTimeSeconds, 10) / Number.parseInt(evento.totalTimeSeconds, 10)) * 100).toFixed(0)}%`
    }

    const mkbe = (distanceKilometers / evento.totalOccurances).toFixed(2)
    let progressoMkbe = "0%"
    if (Number.parseFloat(mkbeLastWeek) && Number.parseFloat(mkbe)) {
      progressoMkbe = `${((Number.parseFloat(mkbeLastWeek) / Number.parseFloat(mkbe)) * 100).toFixed(0)}%`
    }

    const porcentagem = `${(
      (evento.totalTimeSeconds / duracao_viagens_segundos) * 100
    ).toFixed(2)}%`

    if (evento.consumo === 1) {
      totalConsumo += Number.parseInt(evento.totalOccurances, 10)
    }
    if (evento.seguranca === 1) {
      totalSeguranca += Number.parseInt(evento.totalOccurances, 10)
    }

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

  let lastTotalConsumo = 0
  let lastTotalSeguranca = 0
  if (eventosLastWeek.length > 0) {
    lastTotalConsumo = sumWithPrecision(
      eventosLastWeek
        .filter((e: any) => e.consumo === 1)
        .map((e: any) => Number.parseInt(e.totalOccurances, 10)),
    )
    lastTotalSeguranca = sumWithPrecision(
      eventosLastWeek
        .filter((e: any) => e.seguranca === 1)
        .map((e: any) => Number.parseInt(e.totalOccurances, 10)),
    )
  }

  if (lastTotalConsumo !== 0 && totalConsumo !== 0) {
    insert.ranking_consumo_mkbe =
      (distanceKilometers / totalConsumo).toFixed(2) ?? 0
    insert.ranking_consumo_progresso = `${((lastTotalConsumo / totalConsumo) * 100).toFixed(0)}%`
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
    insert.ranking_seguranca_progresso = `${((lastTotalSeguranca / totalSeguranca) * 100).toFixed(0)}%`
  } else {
    insert.ranking_seguranca_progresso = "0%"
  }
  if (distanceKilometers !== 0 && totalSeguranca !== 0) {
    insert.ranking_seguranca_mkbe =
      (distanceKilometers / totalSeguranca).toFixed(2) ?? 0
  } else {
    insert.ranking_seguranca_mkbe = 0
  }

  await connMoratense("follow_up_monitor").insert(insert)
}

const execute = async () => {
  // const hoje = new Date()
  // const start = format(subDays(hoje, 7), "yyyy-MM-dd 00:00:00")
  // const end = format(subDays(hoje, 1), "yyyy-MM-dd 23:59:59")

  const start = "2025-03-24 03:00:00"
  const end = "2025-03-31 02:59:59"

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
