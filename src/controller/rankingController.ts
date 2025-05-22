import { addHours, format, subHours } from "date-fns"
import type { Request, Response } from "express"

import Db from "../database/connectionManagerDev"

// import Summary from "../models/Summary"
// import Meta from "../models/moratense/Meta"
// import EventTypes from "../models/EventTypes"

// Função para somar números com precisão
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

const buscarTiposEventos = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = Db.getConnection()

      const [tiposEventos] = await db.raw(`
          SELECT
            code,
            descricao_exibida,
            consumo,
            seguranca
          FROM
            eventos_viagens_globus_processadas
          GROUP BY
            code
        `)

      resolve(tiposEventos)
    } catch (error) {
      reject(error)
    }
  })
}

const buscarViagensGlobusProcessadas = async ({
  start,
  end,
}: { start: string; end: string }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = Db.getConnection()

      const [viagensGlobus] = await db.raw(`
            SELECT
              c.numero_chassi,
              gl.nome_linha,
              d.employeeNumber AS chapa,
              d.name AS motorista,
              vgp.fk_id_linha_globus,
              sum(vgp.fuelUsedLitres) AS fuelUsedLitres,
              sum(vgp.distanceKilometers) AS distanceKilometers,
              GROUP_CONCAT(vgp.tripsIds SEPARATOR ',') AS tripsIds,
              vgp.data_saida_garagem,
              avg(vgp.media) AS media,
              sum(vgp.duracao_viagens_segundos) AS duracao_viagens_segundos,
              sum(vgp.event_1295_time) AS event_1295_time,
              sum(vgp.event_1255_time) AS event_1255_time,
              sum(vgp.event_1253_time) AS event_1253_time,
              sum(vgp.event_1252_time) AS event_1252_time,
              sum(vgp.event_1250_time) AS event_1250_time,
              sum(vgp.event_1246_time) AS event_1246_time,
              sum(vgp.event_1227_time) AS event_1227_time,
              sum(vgp.event_1156_time) AS event_1156_time,
              sum(vgp.event_1153_time) AS event_1153_time,
              sum(vgp.event_1136_time) AS event_1136_time,
              sum(vgp.event_1124_time) AS event_1124_time,
              sum(vgp.event_1295) AS event_1295,
              sum(vgp.event_1255) AS event_1255,
              sum(vgp.event_1253) AS event_1253,
              sum(vgp.event_1252) AS event_1252,
              sum(vgp.event_1250) AS event_1250,
              sum(vgp.event_1246) AS event_1246,
              sum(vgp.event_1227) AS event_1227,
              sum(vgp.event_1156) AS event_1156,
              sum(vgp.event_1153) AS event_1153,
              sum(vgp.event_1136) AS event_1136,
              sum(vgp.event_1124) AS event_1124,
              sum(vgp.quantidade_viagens) AS quantidade_viagens
            FROM
              viagens_globus_processadas vgp,
              globus_linha gl,
              chassi c,
              drivers d
            WHERE
              vgp.driverId = d.driverId and
              vgp.fk_id_linha_globus = gl.id and
              vgp.fk_id_chassi = c.id and
              data_saida_garagem BETWEEN '${start}' AND '${end}'
            GROUP BY
              vgp.fk_id_linha_globus,
              c.numero_chassi,
              d.employeeNumber
            ORDER BY
              gl.nome_linha,
              d.name`)

      resolve(viagensGlobus)
    } catch (error) {
      reject(error)
    }
  })
}

const buscarMetas = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = Db.getConnection()

      const [metas] = await db.raw(`
        SELECT
          c.numero_chassi,
          m.*
        FROM
          metas m,
          chassi c
        WHERE
          m.fk_id_chassi = c.id
      `)

      resolve(metas)
    } catch (error) {
      reject(error)
    }
  })
}

const ENUMS = {
  FATOR: 2.671, // Cada 1 litro de diesel gera 2.671 kg de CO2
  ARVORE: 163, // Cada árvore absorve 163 kg de CO2 por ano
  MEDIA_CALC_CO2: 1.91,
  VALOR_DIESEL: 5.51728,
}

const index = async (req: Request, res: Response): Promise<any> => {
  const { start, end } = req.query

  // distanceKilometers: sumWithPrecision(arrayKm),
  // fuelUsedLitres: sumWithPrecision(arrayLitros),

  const listaMetas: any = await buscarMetas()

  const tiposEventos: any = await buscarTiposEventos()
  let viagens: any = await buscarViagensGlobusProcessadas({
    start: start as string,
    end: end as string,
  })

  const distanceKilometers = sumWithPrecision(
    viagens.map((viagem: any) => viagem.distanceKilometers),
  )
  const fuelUsedLitres = sumWithPrecision(
    viagens.map((viagem: any) => viagem.fuelUsedLitres),
  )
  const assetQuantity = new Set(viagens.map((viagem: any) => viagem.assetId))
    .size

  const mediaGeral = viagens
    .map((viagem: any) => viagem.media)
    .filter((item: string) => item !== null)

  const soma = mediaGeral.reduce(
    (acc: number, val: string) => acc + Number.parseFloat(val),
    0,
  )
  const media = soma / mediaGeral.length

  // const result = Summary.getSummary({
  //   start: start as string,
  //   end: end as string,
  // })

  // let trips = await Summary.getTrips({
  //   start: start as string,
  //   end: end as string,
  // })

  viagens = viagens.map((viagem: any) => {
    const findMeta = listaMetas.find(
      (meta: any) =>
        meta.numero_chassi === viagem.numero_chassi &&
        meta.id_linha_globus === viagem.id_linha_globus,
    )

    const data_saida_garagem = format(
      new Date(viagem.data_saida_garagem),
      "yyyy-MM-dd HH:mm:ss",
    )

    let atingiuMeta = false
    if (
      findMeta &&
      Number.parseFloat(viagem.media) >= Number.parseFloat(findMeta.meta)
    ) {
      atingiuMeta = true
    }

    let combustivel_economizado_meta = 0
    let combustivel_economizado_media = 0
    let premiacao = 0

    if (findMeta) {
      combustivel_economizado_meta =
        (viagem.distanceKilometers / findMeta.meta - viagem.fuelUsedLitres) *
        ENUMS.VALOR_DIESEL
    }

    combustivel_economizado_media =
      (viagem.distanceKilometers / media - viagem.fuelUsedLitres) *
      ENUMS.VALOR_DIESEL

    if (media < findMeta.meta) {
      premiacao = combustivel_economizado_meta * findMeta.premiacao_meta
    }
    if (media >= findMeta.meta && media < findMeta.premiacao_supermeta) {
      premiacao = combustivel_economizado_meta * findMeta.premiacao_meta
    }
    if (media >= findMeta.premiacao_supermeta) {
      premiacao = combustivel_economizado_meta * findMeta.premiacao_supermeta
    }

    const kg_co2 = viagem.fuelUsedLitres * ENUMS.FATOR
    const kg_co2_km =
      (viagem.fuelUsedLitres * ENUMS.FATOR) / viagem.distanceKilometers
    const lt2 = viagem.distanceKilometers / ENUMS.MEDIA_CALC_CO2
    const kg_co2_2 = lt2 * ENUMS.FATOR
    const reducao_co2 = kg_co2 - kg_co2_2
    const arvores_preservadas = (reducao_co2 / ENUMS.ARVORE) * -1

    return {
      ...viagem,
      findMeta,
      combustivel_economizado_meta: combustivel_economizado_meta
        ? combustivel_economizado_meta.toFixed(2)
        : 0,
      combustivel_economizado_media: combustivel_economizado_media
        ? combustivel_economizado_media.toFixed(2)
        : 0,
      premiacao: premiacao ? premiacao.toFixed(2) : 0,
      kg_co2: kg_co2.toFixed(0),
      kg_co2_km: kg_co2_km.toFixed(2),
      kg_co2_2: kg_co2_2.toFixed(2),
      reducao_co2: reducao_co2.toFixed(0),
      arvores_preservadas: arvores_preservadas.toFixed(2),
      atingiuMeta,
      data_saida_garagem,
    }
  })

  const totalAtingiuMeta = viagens.filter(
    (viagem: any) => viagem.atingiuMeta === true,
  ).length
  const potencialMelhoria = (totalAtingiuMeta / viagens.length) * 100

  const listaComMetas = viagens.filter(
    (viagem: any) => viagem.findMeta !== null,
  )
  const totalMetas = listaComMetas.length
  const mediaMeta =
    listaComMetas.reduce((acc: number, meta: any) => {
      if (meta.findMeta) {
        return acc + Number.parseFloat(meta.findMeta.meta)
      }
      return acc
    }, 0) / totalMetas

  const evetosConsumo = tiposEventos.filter(
    (evento: any) => evento.consumo === 1,
  )
  // const eventosSeguranca = tiposEventos.filter(
  //   (evento: any) => evento.seguranca === 1,
  // )

  const totalizacaoEventosConsumo = viagens.reduce((acc: any, viagem: any) => {
    for (const evento of evetosConsumo) {
      if (evento.consumo === 1) {
        if (!acc[evento.code]) {
          acc[evento.code] = {
            nome: evento.descricao_exibida,
            quantidade: 0,
            seguranca: evento.seguranca,
            consumo: evento.consumo,
          }
        }

        if (viagem[`event_${evento.code}`]) {
          acc[evento.code].quantidade =
            acc[evento.code].quantidade +
            Number.parseFloat(viagem[`event_${evento.code}`])
        }
      }
    }

    return acc
  }, {})

  const resumoConsumo = Object.keys(totalizacaoEventosConsumo)
    .map((key) => {
      const item = totalizacaoEventosConsumo[key]
      return {
        ...item,
        quantidade: Number.parseFloat(item.quantidade),
        code: key,
      }
    })
    .sort((a: any, b: any) => {
      if (a.nome < b.nome) {
        return -1
      }
      if (a.nome > b.nome) {
        return 1
      }
      return 0
    })

  return res.json({
    resumo: {
      distanceKilometers,
      fuelUsedLitres,
      assetQuantity,
      potencialMelhoria: potencialMelhoria
        ? `${potencialMelhoria.toFixed(0)}%`
        : "0%",
      mediaMeta: mediaMeta ? Number(mediaMeta.toFixed(2)) : 0,
      media: media ? Number(media.toFixed(2)) : 0,
    },
    resumoConsumo,
    tiposEventos,
    viagens: viagens,
  })

  // const arrayKm = []
  // const arrayLitros = []
  // const arrayAssets = []
  // const valorDiesel = 5.51728
  // const fator = 2.671 // Cada 1 litro de diesel gera 2.671 kg de CO2
  // const arvore = 163 // Cada árvore absorve 163 kg de CO2 por ano
  // const media_calc_co2 = 1.91

  // // const eventos = []
  // // const todosEventos = await Summary.getEventsByInterval({
  // //   start: format(new Date(start as string), "yyyy-MM-dd 03:00:00"),
  // //   end: format(new Date(end as string), "yyyy-MM-dd 23:59:59"),
  // // })

  // const allEvents = await EventTypes.getAll()

  // for await (const trip of trips) {
  //   const consumo = await Summary.getConsumption({
  //     assetId: trip.assetId,
  //     driverId: trip.driverId,
  //     start: format(new Date(trip.data_saida_garagem), "yyyy-MM-dd HH:mm:ss"),
  //     end: format(new Date(trip.data_recolhido), "yyyy-MM-dd HH:mm:ss"),
  //   })

  //   for await (const item of consumo) {
  //     const eventos = await Summary.getEventsResumeByTrip({
  //       tripId: item.tripId,
  //     })

  //     trip.eventos = eventos
  //   }

  //   // const eventos = todosEventos.filter((evento: any) => {
  //   //   return (
  //   //     evento.assetId === trip.assetId && evento.driverId === trip.driverId
  //   //   )
  //   // })
  //   // const eventos = await Summary.getEventsByAssetAndDriver({
  //   //   assetId: trip.assetId,
  //   //   driverId: trip.driverId,
  //   //   start: format(new Date(trip.data_saida_garagem), "yyyy-MM-dd HH:mm:ss"),
  //   //   end: format(new Date(trip.data_recolhido), "yyyy-MM-dd HH:mm:ss"),
  //   // })

  //   const meta = await Meta.findByChassiAndLinha(
  //     trip.id_chassi,
  //     trip.id_linha_globus,
  //   )
  //   // trip.eventos = eventos
  //   trip.meta = meta
  //   trip.consumo = consumo

  //   arrayAssets.push(trip.assetId)
  //   if (consumo.length > 0) {
  //     for (const item of consumo) {
  //       arrayKm.push(item.distanceKilometers)
  //       arrayLitros.push(item.fuelUsedLitres)
  //     }
  //   }

  //   trip.data_saida_garagem = format(
  //     new Date(trip.data_saida_garagem),
  //     "dd-MM-yyyy HH:mm:ss",
  //   )
  //   trip.data_recolhido = format(
  //     new Date(trip.data_recolhido),
  //     "dd-MM-yyyy HH:mm:ss",
  //   )
  // }

  // trips = trips.filter((trip) => trip.consumo.length > 0)
  // trips = trips.sort((a, b) => {
  //   if (a.nome_linha < b.nome_linha) {
  //     return -1
  //   }
  //   if (a.nome_linha > b.nome_linha) {
  //     return 1
  //   }
  //   if (a.nome < b.nome) {
  //     return -1
  //   }
  //   if (a.nome > b.nome) {
  //     return 1
  //   }
  //   if (a.data_saida_garagem < b.data_saida_garagem) {
  //     return -1
  //   }
  //   if (a.data_saida_garagem > b.data_saida_garagem) {
  //     return 1
  //   }
  //   return 0
  // })

  // let curentIndice = 1
  // const arrayIndice: { indice: number; linha: string }[] = []

  // let agrupadoPorLinha = trips.reduce((acc: any, item: any) => {
  //   const indiceExists = arrayIndice.find(
  //     (i: any) => i.linha === item.chassi_linha,
  //   )

  //   if (!indiceExists) {
  //     arrayIndice.push({ indice: curentIndice, linha: item.chassi_linha })
  //     acc[curentIndice] = [{ resumo: {}, viagens: [item] }]
  //     curentIndice = curentIndice + 1
  //   }

  //   if (indiceExists) {
  //     acc[indiceExists.indice][0].viagens = [
  //       ...acc[indiceExists.indice][0].viagens,
  //       item,
  //     ]
  //   }
  //   return acc
  // }, {})

  // agrupadoPorLinha = Object.keys(agrupadoPorLinha).map((key) => {
  //   const item = agrupadoPorLinha[key]

  //   item[0].viagens = item[0].viagens.filter((v: any) => {
  //     const kms = sumWithPrecision(
  //       v.consumo.map((c: any) => c.distanceKilometers),
  //     )
  //     if (kms <= 0) {
  //       return false
  //     }
  //     const lts = sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
  //     if (lts <= 0) {
  //       return false
  //     }

  //     return true
  //   })

  //   return item
  // })

  // agrupadoPorLinha = agrupadoPorLinha.filter((item: any) => {
  //   return item[0].viagens.length > 0
  // })

  // agrupadoPorLinha = Object.keys(agrupadoPorLinha).map((key) => {
  //   const item = agrupadoPorLinha[key]

  //   item[0].resumo = {
  //     ...item[0].resumo,
  //     veiculos: new Set(item[0].viagens.map((v: any) => v.assetId)).size,

  //     total_acima_meta: item[0].viagens.filter((v: any) => {
  //       const media = (
  //         sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
  //         sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
  //       ).toFixed(2)
  //       if (v.meta) {
  //         if (media >= v.meta.meta) {
  //           return true
  //         }
  //       }
  //       return false
  //     }).length,
  //     total_abaixo_meta: item[0].viagens.filter((v: any) => {
  //       const media = (
  //         sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
  //         sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
  //       ).toFixed(2)
  //       if (v.meta) {
  //         if (media < v.meta.meta) {
  //           return true
  //         }
  //       }
  //       return false
  //     }).length,
  //     potencial_melhoria: `${(
  //       (item[0].viagens.filter((v: any) => {
  //         const media = (
  //           sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
  //           sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
  //         ).toFixed(2)
  //         if (v.meta) {
  //           if (media < v.meta.meta) {
  //             return true
  //           }
  //         }
  //         return false
  //       }).length /
  //         item[0].viagens.length) *
  //         100
  //     ).toFixed(0)}%`,

  //     kmRodados: sumWithPrecision(
  //       item[0].viagens
  //         .map((v: any) => v.consumo.map((a: any) => a.distanceKilometers))
  //         .map((a: any) => sumWithPrecision(a)),
  //     ),
  //     litrosConsumidos: sumWithPrecision(
  //       item[0].viagens
  //         .map((v: any) => v.consumo.map((a: any) => a.fuelUsedLitres))
  //         .map((a: any) => sumWithPrecision(a)),
  //     ),
  //     media: (
  //       item[0].viagens
  //         .map((v: any) => {
  //           return (
  //             sumWithPrecision(
  //               v.consumo.map((c: any) => c.distanceKilometers),
  //             ) / sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
  //           )
  //         })
  //         .reduce((acc: number, media: number) => acc + media, 0) /
  //       item[0].viagens.length
  //     ).toFixed(2),
  //   }
  //   item[0].viagens = item[0].viagens.map((v: any) => {
  //     let meta_atingida = "0%"
  //     const media = (
  //       sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
  //       sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
  //     ).toFixed(2)

  //     if (v.meta) {
  //       if (media >= v.meta.meta) {
  //         meta_atingida = `${(v.meta.premiacao_meta * 100).toFixed(0)}%`
  //       }
  //       if (media >= v.meta.supermeta) {
  //         meta_atingida = `${(v.meta.premiacao_supermeta * 100).toFixed(0)}%`
  //       }
  //     }

  //     const resumoEventos = v.eventos.reduce((acc: any, evento: any) => {
  //       if (!acc.seguranca) {
  //         acc.seguranca = 0
  //       }
  //       if (!acc.consumo) {
  //         acc.consumo = 0
  //       }

  //       const detalheEvento = allEvents.find(
  //         (e: any) => e.eventTypeId === evento.eventTypeId,
  //       )
  //       if (!acc[evento.code]) {
  //         acc[evento.code] = {
  //           nome: evento.description,
  //           quantidade: 0,
  //           eventTypeId: evento.eventTypeId,
  //           seguranca: detalheEvento?.seguranca,
  //           consumo: detalheEvento?.consumo,
  //         }
  //       }
  //       if (detalheEvento?.seguranca) {
  //         acc.seguranca = acc.seguranca + evento.quantity
  //       }
  //       if (detalheEvento?.consumo) {
  //         acc.consumo = acc.consumo + evento.quantity
  //       }
  //       acc[evento.code].quantidade =
  //         acc[evento.code].quantidade + evento.quantity
  //       return acc
  //     }, {})

  //     let combustivel_economizado_meta = 0
  //     let combustivel_economizado_media = 0
  //     let premiacao = 0
  //     if (v.meta) {
  //       combustivel_economizado_meta =
  //         (sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
  //           v.meta.meta -
  //           sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))) *
  //         valorDiesel

  //       combustivel_economizado_media =
  //         (sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
  //           Number.parseFloat(media) -
  //           sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))) *
  //         valorDiesel

  //       if (media <= v.meta.meta) {
  //         premiacao = combustivel_economizado_meta * v.meta.premiacao_meta
  //       }
  //       if (media >= v.meta.meta) {
  //         premiacao = combustivel_economizado_meta * v.meta.premiacao_meta
  //       }
  //       if (media >= v.meta.supermeta) {
  //         premiacao = combustivel_economizado_meta * v.meta.premiacao_supermeta
  //       }
  //     }

  //     const kg_co2 =
  //       sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres)) * fator
  //     const kg_co2_km =
  //       (sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres)) *
  //         fator) /
  //       sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers))
  //     const lt2 =
  //       sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
  //       media_calc_co2
  //     const kg_co2_2 = lt2 * fator
  //     const reducao_co2 = kg_co2 - kg_co2_2
  //     const arvores_preservadas = (reducao_co2 / arvore) * -1

  //     return {
  //       ...v,
  //       kg_co2,
  //       kg_co2_km,
  //       lt2,
  //       kg_co2_2,
  //       reducao_co2,
  //       arvores_preservadas,
  //       resumoEventos,
  //       kmRodados: sumWithPrecision(
  //         v.consumo.map((c: any) => c.distanceKilometers),
  //       ),
  //       litrosConsumidos: sumWithPrecision(
  //         v.consumo.map((c: any) => c.fuelUsedLitres),
  //       ),
  //       media,
  //       meta_atingida,
  //       combustivel_economizado_meta: combustivel_economizado_meta.toFixed(2),
  //       combustivel_economizado_media: combustivel_economizado_media.toFixed(2),
  //       premiacao: premiacao.toFixed(2),
  //       count_total_eventos_consumo: v.eventos.reduce(
  //         (acc: number, evento: any) => {
  //           if (evento.eventTypeId === 1) {
  //             return acc + 1
  //           }
  //           return acc
  //         },
  //         0,
  //       ),
  //       count_total_eventos_seguranca: v.eventos.reduce(
  //         (acc: number, evento: any) => {
  //           if (evento.eventTypeId === 2) {
  //             return acc + 1
  //           }
  //           return acc
  //         },
  //         0,
  //       ),
  //     }
  //   })

  //   return item
  // })

  // for (const item of agrupadoPorLinha) {
  //   item[0].viagens = item[0].viagens.sort((a: any, b: any) => {
  //     if (a.resumoEventos.seguranca > b.resumoEventos.seguranca) {
  //       return -1
  //     }
  //     if (a.resumoEventos.seguranca < b.resumoEventos.seguranca) {
  //       return 1
  //     }
  //     return 0
  //   })
  //   item[0].viagens = item[0].viagens.map((v: any, index: number) => {
  //     return {
  //       ...v,
  //       resumoEventos: {
  //         ...v.resumoEventos,
  //         rank_seguranca: index + 1,
  //       },
  //     }
  //   })

  //   item[0].viagens = item[0].viagens.sort((a: any, b: any) => {
  //     if (a.resumoEventos.consumo > b.resumoEventos.consumo) {
  //       return -1
  //     }
  //     if (a.resumoEventos.consumo < b.resumoEventos.consumo) {
  //       return 1
  //     }
  //     return 0
  //   })
  //   item[0].viagens = item[0].viagens.map((v: any, index: number) => {
  //     return {
  //       ...v,
  //       resumoEventos: {
  //         ...v.resumoEventos,
  //         rank_consumo: index + 1,
  //       },
  //     }
  //   })
  // }

  // const [result1] = await Promise.all([result])

  // const resumoEventos: any = {}
  // for (const item of trips) {
  //   for (const evento of item.eventos) {
  //     if (!resumoEventos[evento.code]) {
  //       const detalheEvento = await EventTypes.findMixCode(evento.eventTypeId)

  //       resumoEventos[evento.code] = {
  //         nome: evento.description,
  //         quantidade: 0,
  //         eventTypeId: evento.eventTypeId,
  //         seguranca: detalheEvento.seguranca,
  //         consumo: detalheEvento.consumo,
  //       }
  //     }
  //     resumoEventos[evento.code].quantidade =
  //       resumoEventos[evento.code].quantidade + 1
  //   }
  // }

  // return res.json({
  //   summary: result1,
  //   distanceKilometers: sumWithPrecision(arrayKm),
  //   fuelUsedLitres: sumWithPrecision(arrayLitros),
  //   assetsQuantity: new Set(arrayAssets).size,
  //   agrupadoPorLinha,
  //   resumoEventos,
  //   // arrayIndice,
  // })
}

export default {
  index,
}
