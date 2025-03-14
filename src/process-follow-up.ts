import "dotenv/config"
import { subDays, format, parse } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"
import DbTeleconsult from "./database/connectionManager"

type Params = {
  start: string
  end: string
  idsMotoristas: number[]
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

const execute = async ({ start, end, idsMotoristas }: Params) => {
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

  for await (const idMotorista of idsMotoristas) {
    const [motorista] = await dbMoratense.raw(`
      SELECT
        driverId
      FROM
        drivers
      WHERE
        employeeNumber = ${idMotorista}
    `)

    if (!motorista) {
      continue
    }

    const { driverId } = motorista[0]

    const kmLastWeek = await buscarKilometragePeriodo({
      start: startLastWeek,
      end: endLastWeek,
      idMotorista,
    })

    const kmThisWeek = await buscarKilometragePeriodo({
      start,
      end,
      idMotorista,
    })

    const dataLastWeek = await buscarDadosPerido({
      start: startLastWeek,
      end: endLastWeek,
      idMotorista,
    })

    if (!dataLastWeek) {
      continue
    }

    const dataThisWeek = await buscarDadosPerido({
      start,
      end,
      idMotorista,
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

    // console.log(
    //   JSON.stringify(
    //     {
    //       dataLastWeek: dataLastWeekGroupedSum.length,
    //       dataThisWeek: dataThisWeekGroupedSum.length,
    //       dataLastWeekGroupedSum: dataLastWeekGroupedSum["1722"],
    //       dataThisWeekGroupedSum: dataThisWeekGroupedSum["1722"],
    //     },
    //     null,
    //     2,
    //   ),
    // )

    // console.log({
    //   idMotorista,
    //   kmLastWeek,
    //   kmThisWeek,
    // })

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
            insert.follow_up_date = "2025-03-10 08:00:00"
            insert.driverId = driverId
            insert.monitorId = "1598105950770192384"
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

            const mkbe = (
              kmThisWeek.km / dataThisWeekEvento.quantidades_ocorrencias
            ).toFixed(2)
            const porcentagem = (
              (dataThisWeekEvento.tempo / kmThisWeek.tempo_total_segundos) *
              100
            ).toFixed(2)
            const qtdLastWeek = dataLastWeekEvento.quantidades_ocorrencias
            const qtdThisWeek = dataThisWeekEvento.quantidades_ocorrencias
            const progresso = `${((qtdLastWeek / qtdThisWeek) * 100).toFixed(0)}%`

            if (IdEvento === "1124") {
              // (RT) Fora da Faixa Verde
              insert.fora_faixa_verde_mkbe = mkbe ?? 0
              insert.fora_faixa_verde_progresso = progresso ?? 0
              insert.fora_faixa_verde_porcentagem = porcentagem ?? 0
            }
            if (IdEvento === "1153") {
              // (RT) Marcha Lenta Excessiva
              insert.marcha_lenta_excessiva_mkbe = mkbe ?? 0
              insert.marcha_lenta_excessiva_progresso = progresso ?? 0
            }
            if (IdEvento === "1156") {
              // (RT) Aceleração Brusca
              insert.aceleracao_brusca_mkbe = mkbe ?? 0
              insert.aceleracao_brusca_progresso = progresso ?? 0
            }
            // if(IdEvento === '1246') { // (RT) Uso indevido pedal acelerador 85%
            // }
            if (IdEvento === "1250") {
              // (RT) Excesso de Rotação
              insert.excesso_rotacao_mkbe = mkbe ?? 0
              insert.excesso_rotacao_progresso = progresso ?? 0
              insert.excesso_rotacao_porcentagem = porcentagem ?? 0
            }
            if (IdEvento === "1252") {
              // (RT) Curva Brusca
              insert.curva_brusca_mkbe = mkbe ?? 0
              insert.curva_brusca_progresso = progresso ?? 0
            }
            if (IdEvento === "1253") {
              // (RT) Freada Brusca
              insert.freada_brusca_mkbe = mkbe ?? 0
              insert.freada_brusca_progresso = progresso ?? 0
            }
            if (IdEvento === "1255") {
              // (RT) Inércia M.Benz
              insert.inercia_mkbe = mkbe ?? 0
              insert.inercia_progresso = progresso ?? 0
              insert.inercia_porcentagem = porcentagem ?? 0
            }
            if (IdEvento === "1136") {
              // (RT) Excesso de Velocidade
              insert.excesso_velocidade_mkbe = mkbe ?? 0
              insert.excesso_velocidade_progresso = progresso ?? 0
            }

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

        console.log(insert)

        await dbMoratense("follow_up_driver").insert(insert)
      }
    }
  }

  console.log("FIM")
}

const test = async () => {
  const connTeleconsult = DbTeleconsult.getConnection()
  let [listaMotoristas] = await connTeleconsult.raw(`
      SELECT
        distinct motorista_cod
      FROM
        drank_tel_viagens
      WHERE
        data_ini BETWEEN '2025-03-02 03:00:00' AND '2025-03-09 02:59:59' and
        motorista_cod > 0
      ORDER BY
        motorista_cod
  `)

  listaMotoristas = listaMotoristas.map((item: any) => item.motorista_cod)

  await execute({
    start: "2025-03-02 03:00:00",
    end: "2025-03-09 02:59:59",
    idsMotoristas: listaMotoristas,
  })
}

test()
