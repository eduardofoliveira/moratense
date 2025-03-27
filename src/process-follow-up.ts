import "dotenv/config"
import { subDays, format, parse, addDays } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"
import DbTeleconsult from "./database/connectionManager"

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

type IbuscarKilometragePeriodo = {
  start: string
  end: string
  idMotorista: number
}

const buscarKilometragePeriodo = async ({
  start,
  end,
  idMotorista,
}: IbuscarKilometragePeriodo) => {
  const dbTeleconsult = DbTeleconsult.getConnection()

  const [[result]] = await dbTeleconsult.raw(`
    SELECT
      SUM(km) AS km,
      SUM(TIMESTAMPDIFF(SECOND, data_ini, data_fim)) AS tempo_total_segundos
    FROM
      drank_tel_viagens
    WHERE
      data_ini BETWEEN '${start}' AND '${end}' and
      motorista_cod = ${idMotorista}
  `)

  return result
}

const buscarDadosPerido = async ({
  start,
  end,
  idMotorista,
}: IbuscarKilometragePeriodo) => {
  const dbTeleconsult = DbTeleconsult.getConnection()

  const [dataThisWeek] = await dbTeleconsult.raw(`
    SELECT
      e.id_motorista,
      e.id_tipo,
      e.carro,
      e.id_carro_tel,
      SUM(e.tempo) AS tempo,
      SUM(e.quantidades_ocorrencias) AS quantidades_ocorrencias,
      m.codigo,
      m.nome,
      et.nome,
      et.rank_consulmo,
      et.rank_seguranca
    FROM
      drank_tel_eventos e,
      drank_tel_motoristas m,
      telemetria_tipos_eventos et
    WHERE
      e.id_motorista = m.codigo_motorista and
      e.id_tipo = et.id and
      e.data_ini BETWEEN '${start}' AND '${end}' and
      e.id_motorista = ${idMotorista}
    GROUP BY
      e.id_motorista,
      e.id_tipo,
      e.carro,
      e.id_carro_tel
    ORDER BY
      e.id_motorista,
      e.carro,
      e.id_tipo
  `)

  const idsCarro = Array.from(
    new Set(dataThisWeek.map((item: any) => item.carro)),
  ).join(",")

  if (!idsCarro) {
    return false
  }

  const [carroChassi] = await dbTeleconsult.raw(`
      SELECT
        c.codigo as carro,
        ch.codigo as chassi
      FROM
        carros c,
        carros_chassis cc,
        chassis ch
      WHERE
        c.codigo IN (${idsCarro}) and
        c.id = cc.id_carro and
        cc.id_chassi = ch.id
      ORDER BY
        c.codigo asc
  `)

  for (const item of dataThisWeek) {
    const carro = carroChassi.find((carro: any) => carro.carro === item.carro)

    item.chassi = carro.chassi
  }

  return dataThisWeek
}

const execute = async ({ start, end, listaProcessar }: Params) => {
  const dbMoratense = DbMoratense.getConnection()
  const dbTeleconsult = DbTeleconsult.getConnection()

  const startLastWeek = format(
    subDays(parse(start, "yyyy-MM-dd HH:mm:ss", new Date()), 7),
    "yyyy-MM-dd HH:mm:ss",
  )
  const endLastWeek = format(
    subDays(parse(end, "yyyy-MM-dd HH:mm:ss", new Date()), 7),
    "yyyy-MM-dd HH:mm:ss",
  )

  console.log({
    start,
    end,
    startLastWeek,
    endLastWeek,
  })

  for await (const item of listaProcessar) {
    const [motorista] = await dbMoratense.raw(`
      SELECT
        driverId
      FROM
        drivers
      WHERE
        employeeNumber = ${item.chapa_motorista}
    `)

    if (!motorista) {
      continue
    }

    const { driverId } = motorista[0]

    const kmLastWeek = await buscarKilometragePeriodo({
      start: startLastWeek,
      end: endLastWeek,
      idMotorista: item.chapa_motorista,
    })

    const kmThisWeek = await buscarKilometragePeriodo({
      start,
      end,
      idMotorista: item.chapa_motorista,
    })

    const dataLastWeek = await buscarDadosPerido({
      start: startLastWeek,
      end: endLastWeek,
      idMotorista: item.chapa_motorista,
    })

    if (!dataLastWeek) {
      continue
    }

    const dataThisWeek = await buscarDadosPerido({
      start,
      end,
      idMotorista: item.chapa_motorista,
    })

    if (!dataThisWeek) {
      continue
    }

    const dataLastWeekGrouped = dataLastWeek.reduce((acc: any, curr: any) => {
      const { chassi, ...rest } = curr
      if (!acc[chassi]) {
        acc[chassi] = []
      }
      acc[chassi].push(rest)
      return acc
    }, {})

    const dataThisWeekGrouped = dataThisWeek.reduce((acc: any, curr: any) => {
      const { chassi, ...rest } = curr
      if (!acc[chassi]) {
        acc[chassi] = []
      }
      acc[chassi].push(rest)
      return acc
    }, {})

    const dataLastWeekGroupedSum = Object.keys(dataLastWeekGrouped).reduce(
      (acc: any, curr: any) => {
        const data = dataLastWeekGrouped[curr]
        const sum = data.reduce((acc: any, curr: any) => {
          if (!acc[curr.id_tipo]) {
            acc[curr.id_tipo] = {
              tempo: 0,
              quantidades_ocorrencias: 0,
              rank_consumo: curr.rank_consulmo,
              rank_seguranca: curr.rank_seguranca,
              nome: curr.nome,
            }
          }
          acc[curr.id_tipo].tempo += Number(curr.tempo)
          acc[curr.id_tipo].quantidades_ocorrencias += Number(
            curr.quantidades_ocorrencias,
          )
          return acc
        }, {})
        acc[curr] = sum
        return acc
      },
      {},
    )

    // sumar por chassi
    const dataThisWeekGroupedSum = Object.keys(dataThisWeekGrouped).reduce(
      (acc: any, curr: any) => {
        const data = dataThisWeekGrouped[curr]
        const sum = data.reduce((acc: any, curr: any) => {
          if (!acc[curr.id_tipo]) {
            acc[curr.id_tipo] = {
              tempo: 0,
              quantidades_ocorrencias: 0,
              rank_consumo: curr.rank_consulmo,
              rank_seguranca: curr.rank_seguranca,
              nome: curr.nome,
            }
          }
          acc[curr.id_tipo].tempo += Number(curr.tempo)
          acc[curr.id_tipo].quantidades_ocorrencias += Number(
            curr.quantidades_ocorrencias,
          )
          return acc
        }, {})
        acc[curr] = sum
        return acc
      },
      {},
    )

    for (const chassi of Object.keys(dataThisWeekGroupedSum)) {
      const dataLastWeek = dataLastWeekGroupedSum[chassi]
      const dataThisWeek = dataThisWeekGroupedSum[chassi]

      const insert: any = {}
      insert.fora_faixa_verde_mkbe = 0
      insert.fora_faixa_verde_progresso = 0
      insert.fora_faixa_verde_porcentagem = 0
      insert.marcha_lenta_excessiva_mkbe = 0
      insert.marcha_lenta_excessiva_progresso = 0
      insert.aceleracao_brusca_mkbe = 0
      insert.aceleracao_brusca_progresso = 0
      insert.excesso_rotacao_mkbe = 0
      insert.excesso_rotacao_progresso = 0
      insert.excesso_rotacao_porcentagem = 0
      insert.curva_brusca_mkbe = 0
      insert.curva_brusca_progresso = 0
      insert.freada_brusca_mkbe = 0
      insert.freada_brusca_progresso = 0
      insert.inercia_mkbe = 0
      insert.inercia_progresso = 0
      insert.inercia_porcentagem = 0
      insert.excesso_velocidade_mkbe = 0
      insert.excesso_velocidade_progresso = 0

      let lastTotalConsumo = 0
      let lastTotalSeguranca = 0
      let totalConsumo = 0
      let totalSeguranca = 0

      if (dataLastWeek && dataThisWeek) {
        for (const IdEvento of Object.keys(dataThisWeek)) {
          const dataLastWeekEvento = dataLastWeek[IdEvento]
          const dataThisWeekEvento = dataThisWeek[IdEvento]

          if (dataLastWeekEvento && dataThisWeekEvento) {
            insert.fk_id_follow_up_type = 1
            insert.follow_up_date = start.replace("00:00:00", "08:00:00")
            insert.driverId = item.driverId
            insert.monitorId = item.monitorId
            insert.chassi = chassi

            if (dataLastWeekEvento.rank_consumo === 1) {
              lastTotalConsumo += dataLastWeekEvento.quantidades_ocorrencias
            }
            if (dataLastWeekEvento.rank_seguranca === 1) {
              lastTotalSeguranca += dataLastWeekEvento.quantidades_ocorrencias
            }
            if (dataThisWeekEvento.rank_consumo === 1) {
              totalConsumo += dataThisWeekEvento.quantidades_ocorrencias
            }
            if (dataThisWeekEvento.rank_seguranca === 1) {
              totalSeguranca += dataThisWeekEvento.quantidades_ocorrencias
            }

            const mkbeLastWeek = (
              kmLastWeek.km / dataLastWeekEvento.quantidades_ocorrencias
            ).toFixed(2)
            const mkbe = (
              kmThisWeek.km / dataThisWeekEvento.quantidades_ocorrencias
            ).toFixed(2)

            const porcentagem = (
              (dataThisWeekEvento.tempo / kmThisWeek.tempo_total_segundos) *
              100
            ).toFixed(2)
            const qtdLastWeek = dataLastWeekEvento.quantidades_ocorrencias
            const qtdThisWeek = dataThisWeekEvento.quantidades_ocorrencias

            const tempoLastWeek = dataLastWeekEvento.tempo
            const tempoThisWeek = dataThisWeekEvento.tempo

            // Alterar o progresso em vez de quantidade calcular o tempo
            const progresso = `${((qtdLastWeek / qtdThisWeek) * 100).toFixed(0)}%`
            const progressoTempo = `${((tempoLastWeek / tempoThisWeek) * 100).toFixed(0)}%`

            const progressoUltimos4 = `${((Number.parseFloat(mkbeLastWeek) / Number.parseFloat(mkbe)) * 100).toFixed(0)}%`

            // Calculo baseado em tempo, progresso e porcentagem
            if (IdEvento === "1255") {
              // (RT) Inércia M.Benz
              insert.inercia_mkbe = mkbe ?? 0
              insert.inercia_progresso = progressoTempo ?? 0
              insert.inercia_progresso_mkbe = progressoUltimos4 ?? 0
              insert.inercia_porcentagem = porcentagem ?? 0
            }
            if (IdEvento === "1124") {
              // (RT) Fora da Faixa Verde
              insert.fora_faixa_verde_mkbe = mkbe ?? 0
              insert.fora_faixa_verde_progresso = progressoTempo ?? 0
              insert.fora_faixa_verde_progresso_mkbe = progressoUltimos4 ?? 0
              insert.fora_faixa_verde_porcentagem = porcentagem ?? 0
            }
            if (IdEvento === "1250") {
              // (RT) Excesso de Rotação
              insert.excesso_rotacao_mkbe = mkbe ?? 0
              insert.excesso_rotacao_progresso = progressoTempo ?? 0
              insert.excesso_rotacao_progresso_mbke = progressoUltimos4 ?? 0
              insert.excesso_rotacao_porcentagem = porcentagem ?? 0
            }
            if (IdEvento === "1253") {
              // (RT) Freada Brusca
              insert.freada_brusca_mkbe = mkbe ?? 0
              insert.freada_brusca_progresso = progressoTempo ?? 0
              insert.freada_brusca_progresso_mkbe = progressoUltimos4 ?? 0
              insert.freada_brusca_porcentagem = porcentagem ?? 0
            }

            // Calcular o progresso com base no mbke
            if (IdEvento === "1153") {
              // (RT) Marcha Lenta Excessiva
              insert.marcha_lenta_excessiva_mkbe = mkbe ?? 0
              insert.marcha_lenta_excessiva_progresso = progressoUltimos4 ?? 0
            }
            if (IdEvento === "1156") {
              // (RT) Aceleração Brusca
              insert.aceleracao_brusca_mkbe = mkbe ?? 0
              insert.aceleracao_brusca_progresso = progressoTempo ?? 0
              insert.aceleracao_brusca_progresso_mkbe = progressoUltimos4 ?? 0
              insert.aceleracao_brusca_porcentagem = porcentagem ?? 0
            }
            if (IdEvento === "1252") {
              // (RT) Curva Brusca
              insert.curva_brusca_mkbe = mkbe ?? 0
              insert.curva_brusca_progresso = progressoUltimos4 ?? 0
            }
            if (IdEvento === "1136") {
              // (RT) Excesso de Velocidade
              insert.excesso_velocidade_mkbe = mkbe ?? 0
              insert.excesso_velocidade_progresso = progressoUltimos4 ?? 0
            }

            // Ranking calcular pela quantidade.
            // Adicionar coluna ultima orientação
            // Adicionar no banco este dois campos:
            // aceleracao_brusca_progresso_mkbe
            // aceleracao_brusca_porcentagem

            // console.log({
            //   chassi,
            //   IdEvento,
            //   evento: dataThisWeekEvento.nome,
            //   kmLastWeek,
            //   tempo: dataThisWeekEvento.tempo,
            //   porcentagem: (
            //     (dataThisWeekEvento.tempo / kmThisWeek.tempo_total_segundos) *
            //     100
            //   ).toFixed(2),
            //   mkbe: (
            //     kmLastWeek.km / dataThisWeekEvento.quantidades_ocorrencias
            //   ).toFixed(2),
            //   // dataLastWeekTipo,
            //   // dataThisWeekTipo,
            // })
          }
        }

        if (lastTotalConsumo !== 0 && totalConsumo !== 0) {
          insert.ranking_consumo_mkbe =
            (kmThisWeek.km / totalConsumo).toFixed(2) ?? 0
          insert.ranking_consumo_progresso = `${((lastTotalConsumo / totalConsumo) * 100).toFixed(0)}%`
        } else {
          insert.ranking_consumo_progresso = "0%"
        }

        if (kmThisWeek.km !== 0 && totalConsumo !== 0) {
          insert.ranking_consumo_mkbe =
            (kmThisWeek.km / totalConsumo).toFixed(2) ?? 0
        } else {
          insert.ranking_consumo_mkbe = 0
        }

        if (lastTotalSeguranca !== 0 && totalSeguranca !== 0) {
          insert.ranking_seguranca_progresso = `${((lastTotalSeguranca / totalSeguranca) * 100).toFixed(0)}%`
        } else {
          insert.ranking_seguranca_progresso = "0%"
        }

        if (kmThisWeek.km !== 0 && totalSeguranca !== 0) {
          insert.ranking_seguranca_mkbe =
            (kmThisWeek.km / totalSeguranca).toFixed(2) ?? 0
        } else {
          insert.ranking_seguranca_mkbe = 0
        }

        insert.last_orientation = format(
          new Date(item.horario),
          "yyyy-MM-dd HH:mm:ss",
        )

        console.log(insert)

        await dbMoratense("follow_up_driver").insert(insert)
      }
    }
  }

  await dbMoratense.raw(`
    UPDATE
      follow_up
    SET
      processado = 1
    WHERE
      horario BETWEEN '${start}' AND '${end}'
  `)

  console.log("FIM")
}

const test = async () => {
  // const hoje = new Date()
  // const start = format(subDays(hoje, 7), "yyyy-MM-dd 00:00:00")
  // const end = format(subDays(hoje, 1), "yyyy-MM-dd 23:59:59")

  const start = "2025-03-24 00:00:00"
  const end = "2025-03-30 23:59:59"

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
