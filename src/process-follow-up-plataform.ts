import "dotenv/config"
import { subDays, format, parse, addDays } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"

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

const buscarChapasMotoristasVideos = async (start: string, end: string) => {
  const connMoratense = DbMoratense.getConnection()

  const query = `
    SELECT
      distinct c.chapa
    FROM
      teleconsult.drank_videos_colaboradores dvc,
      teleconsult.colaboradores c
    WHERE
      dvc.codigo_colaborador = c.codigo and
      dvc.data_assistido BETWEEN ? AND ?
  `

  const [rows] = await connMoratense.raw(query, [start, end])
  return rows.map((row: any) => {
    return row.chapa
  })
}

const buscarChapasMotoristasMensagens = async (start: string, end: string) => {
  const connMoratense = DbMoratense.getConnection()

  const query = `
    SELECT
      distinct c.chapa
    FROM
      teleconsult.drank_mensagens_colaboradores mc,
      teleconsult.colaboradores c
    WHERE
      c.codigo = mc.codigo_colaborador and
	    mc.data_visualizado BETWEEN ? AND ?
  `

  const [rows] = await connMoratense.raw(query, [start, end])
  return rows.map((row: any) => {
    return row.chapa
  })
}

const gerarIndicadores = async (
  start: string,
  end: string,
  chapas: number[],
  tipo: number,
) => {
  const startLastWeek = format(
    subDays(parse(start, "yyyy-MM-dd HH:mm:ss", new Date()), 7),
    "yyyy-MM-dd HH:mm:ss",
  )
  const endLastWeek = format(
    subDays(parse(end, "yyyy-MM-dd HH:mm:ss", new Date()), 7),
    "yyyy-MM-dd HH:mm:ss",
  )
  const connMoratense = DbMoratense.getConnection()

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
          d.employeeNumber IN (${chapas.join(",")})
      ) and
      v.data_saida_garagem BETWEEN '${startLastWeek}' AND '${endLastWeek}'`)
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
          d.employeeNumber IN (${chapas.join(",")})
      ) and
      v.data_saida_garagem BETWEEN '${start}' AND '${end}'`)

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
          d.employeeNumber IN (${chapas.join(",")})
      ) and
      v.data_saida_garagem BETWEEN '${startLastWeek}' AND '${endLastWeek}'
    GROUP BY
      e.code`)
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
          d.employeeNumber IN (${chapas.join(",")})
      ) and
      v.data_saida_garagem BETWEEN '${start}' AND '${end}'
    GROUP BY
      e.code`)

  const [quantidadeMotoristas] = await connMoratense.raw(`
    SELECT
      count(distinct d.driverId) AS qtd_orientados,
      (SELECT COUNT(distinct chapa_motorista) FROM follow_up WHERE horario BETWEEN '${start}' AND '${end}') AS total
    FROM
      drivers d,
      viagens_globus_processadas v
    WHERE
      d.driverId = v.driverId and
      d.employeeNumber IN (${chapas.join(",")})`)
  const { qtd_orientados, total } = quantidadeMotoristas[0]
  const porcentagemMotoristas = `${((qtd_orientados / total) * 100).toFixed(2)}%`

  let totalConsumo = 0
  let totalSeguranca = 0
  const insert: any = {}
  insert.fk_id_follow_up_type = tipo
  insert.follow_up_date = end.replace("02:59:59", "08:00:00")
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
    }

    const mkbe = (distanceKilometers / evento.totalOccurances).toFixed(2)
    let progressoMkbe = "0%"
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

  await connMoratense("follow_up_plataform").insert(insert)
}

const execute = async () => {
  // const hoje = new Date()
  // const start = format(subDays(hoje, 7), "yyyy-MM-dd 00:00:00")
  // const end = format(subDays(hoje, 1), "yyyy-MM-dd 23:59:59")

  const start = "2025-05-19 03:00:00"
  const end = "2025-05-26 02:59:59"

  const chapasVideos = await buscarChapasMotoristasVideos(start, end)
  if (chapasVideos.length === 0) {
    console.log("Nenhum motorista orientado")
  } else {
    await gerarIndicadores(start, end, chapasVideos, 3)
  }

  const chapasMensagens = await buscarChapasMotoristasMensagens(start, end)
  if (chapasMensagens.length === 0) {
    console.log("Nenhum motorista orientado")
  } else {
    await gerarIndicadores(start, end, chapasMensagens, 4)
  }
  console.log("Indicadores gerados com sucesso!")
}

execute()
