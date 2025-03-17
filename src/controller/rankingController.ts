import { addHours, format, subHours } from "date-fns"
import type { Request, Response } from "express"

import Summary from "../models/Summary"
import Meta from "../models/moratense/Meta"
import EventTypes from "../models/EventTypes"

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

const index = async (req: Request, res: Response): Promise<any> => {
  const { start, end } = req.query

  const result = Summary.getSummary({
    start: start as string,
    end: end as string,
  })

  let trips = await Summary.getTrips({
    start: start as string,
    end: end as string,
  })

  const arrayKm = []
  const arrayLitros = []
  const arrayAssets = []
  const valorDiesel = 5.51728
  // const eventos = []
  // const todosEventos = await Summary.getEventsByInterval({
  //   start: format(new Date(start as string), "yyyy-MM-dd 03:00:00"),
  //   end: format(new Date(end as string), "yyyy-MM-dd 23:59:59"),
  // })

  const allEvents = await EventTypes.getAll()

  for await (const trip of trips) {
    const consumo = await Summary.getConsumption({
      assetId: trip.assetId,
      driverId: trip.driverId,
      start: format(new Date(trip.data_saida_garagem), "yyyy-MM-dd HH:mm:ss"),
      end: format(new Date(trip.data_recolhido), "yyyy-MM-dd HH:mm:ss"),
    })

    for await (const item of consumo) {
      const eventos = await Summary.getEventsResumeByTrip({
        tripId: item.tripId,
      })

      trip.eventos = eventos
    }

    // const eventos = todosEventos.filter((evento: any) => {
    //   return (
    //     evento.assetId === trip.assetId && evento.driverId === trip.driverId
    //   )
    // })
    // const eventos = await Summary.getEventsByAssetAndDriver({
    //   assetId: trip.assetId,
    //   driverId: trip.driverId,
    //   start: format(new Date(trip.data_saida_garagem), "yyyy-MM-dd HH:mm:ss"),
    //   end: format(new Date(trip.data_recolhido), "yyyy-MM-dd HH:mm:ss"),
    // })

    const meta = await Meta.findByChassiAndLinha(
      trip.id_chassi,
      trip.id_linha_globus,
    )
    // trip.eventos = eventos
    trip.meta = meta
    trip.consumo = consumo

    arrayAssets.push(trip.assetId)
    if (consumo.length > 0) {
      for (const item of consumo) {
        arrayKm.push(item.distanceKilometers)
        arrayLitros.push(item.fuelUsedLitres)
      }
    }

    trip.data_saida_garagem = format(
      new Date(trip.data_saida_garagem),
      "dd-MM-yyyy HH:mm:ss",
    )
    trip.data_recolhido = format(
      new Date(trip.data_recolhido),
      "dd-MM-yyyy HH:mm:ss",
    )
  }

  trips = trips.filter((trip) => trip.consumo.length > 0)
  trips = trips.sort((a, b) => {
    if (a.nome_linha < b.nome_linha) {
      return -1
    }
    if (a.nome_linha > b.nome_linha) {
      return 1
    }
    if (a.nome < b.nome) {
      return -1
    }
    if (a.nome > b.nome) {
      return 1
    }
    if (a.data_saida_garagem < b.data_saida_garagem) {
      return -1
    }
    if (a.data_saida_garagem > b.data_saida_garagem) {
      return 1
    }
    return 0
  })

  let curentIndice = 1
  const arrayIndice: { indice: number; linha: string }[] = []

  let agrupadoPorLinha = trips.reduce((acc: any, item: any) => {
    const indiceExists = arrayIndice.find(
      (i: any) => i.linha === item.chassi_linha,
    )

    if (!indiceExists) {
      arrayIndice.push({ indice: curentIndice, linha: item.chassi_linha })
      acc[curentIndice] = [{ resumo: {}, viagens: [item] }]
      curentIndice = curentIndice + 1
    }

    if (indiceExists) {
      acc[indiceExists.indice][0].viagens = [
        ...acc[indiceExists.indice][0].viagens,
        item,
      ]
    }
    return acc
  }, {})

  agrupadoPorLinha = Object.keys(agrupadoPorLinha).map((key) => {
    const item = agrupadoPorLinha[key]

    item[0].viagens = item[0].viagens.filter((v: any) => {
      const kms = sumWithPrecision(
        v.consumo.map((c: any) => c.distanceKilometers),
      )
      if (kms <= 0) {
        return false
      }
      const lts = sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
      if (lts <= 0) {
        return false
      }

      return true
    })

    return item
  })

  agrupadoPorLinha = agrupadoPorLinha.filter((item: any) => {
    return item[0].viagens.length > 0
  })

  agrupadoPorLinha = Object.keys(agrupadoPorLinha).map((key) => {
    const item = agrupadoPorLinha[key]

    item[0].resumo = {
      ...item[0].resumo,
      veiculos: new Set(item[0].viagens.map((v: any) => v.assetId)).size,

      total_acima_meta: item[0].viagens.filter((v: any) => {
        const media = (
          sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
          sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
        ).toFixed(2)
        if (v.meta) {
          if (media >= v.meta.meta) {
            return true
          }
        }
        return false
      }).length,
      total_abaixo_meta: item[0].viagens.filter((v: any) => {
        const media = (
          sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
          sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
        ).toFixed(2)
        if (v.meta) {
          if (media < v.meta.meta) {
            return true
          }
        }
        return false
      }).length,
      potencial_melhoria: `${(
        (item[0].viagens.filter((v: any) => {
          const media = (
            sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
            sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
          ).toFixed(2)
          if (v.meta) {
            if (media < v.meta.meta) {
              return true
            }
          }
          return false
        }).length /
          item[0].viagens.length) *
          100
      ).toFixed(0)}%`,

      kmRodados: sumWithPrecision(
        item[0].viagens
          .map((v: any) => v.consumo.map((a: any) => a.distanceKilometers))
          .map((a: any) => sumWithPrecision(a)),
      ),
      litrosConsumidos: sumWithPrecision(
        item[0].viagens
          .map((v: any) => v.consumo.map((a: any) => a.fuelUsedLitres))
          .map((a: any) => sumWithPrecision(a)),
      ),
      media: (
        item[0].viagens
          .map((v: any) => {
            return (
              sumWithPrecision(
                v.consumo.map((c: any) => c.distanceKilometers),
              ) / sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
            )
          })
          .reduce((acc: number, media: number) => acc + media, 0) /
        item[0].viagens.length
      ).toFixed(2),
    }
    item[0].viagens = item[0].viagens.map((v: any) => {
      let meta_atingida = "0%"
      const media = (
        sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
        sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))
      ).toFixed(2)

      if (v.meta) {
        if (media >= v.meta.meta) {
          meta_atingida = `${(v.meta.premiacao_meta * 100).toFixed(0)}%`
        }
        if (media >= v.meta.supermeta) {
          meta_atingida = `${(v.meta.premiacao_supermeta * 100).toFixed(0)}%`
        }
      }

      const resumoEventos = v.eventos.reduce((acc: any, evento: any) => {
        if (!acc.seguranca) {
          acc.seguranca = 0
        }
        if (!acc.consumo) {
          acc.consumo = 0
        }

        const detalheEvento = allEvents.find(
          (e: any) => e.eventTypeId === evento.eventTypeId,
        )
        if (!acc[evento.code]) {
          acc[evento.code] = {
            nome: evento.description,
            quantidade: 0,
            eventTypeId: evento.eventTypeId,
            seguranca: detalheEvento?.seguranca,
            consumo: detalheEvento?.consumo,
          }
        }
        if (detalheEvento?.seguranca) {
          acc.seguranca = acc.seguranca + evento.quantity
        }
        if (detalheEvento?.consumo) {
          acc.consumo = acc.consumo + evento.quantity
        }
        acc[evento.code].quantidade =
          acc[evento.code].quantidade + evento.quantity
        return acc
      }, {})

      let combustivel_economizado_meta = 0
      let combustivel_economizado_media = 0
      let premiacao = 0
      if (v.meta) {
        combustivel_economizado_meta =
          (sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
            v.meta.meta -
            sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))) *
          valorDiesel

        combustivel_economizado_media =
          (sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
            Number.parseFloat(media) -
            sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))) *
          valorDiesel

        if (media <= v.meta.meta) {
          premiacao = combustivel_economizado_meta * v.meta.premiacao_meta
        }
        if (media >= v.meta.meta) {
          premiacao = combustivel_economizado_meta * v.meta.premiacao_meta
        }
        if (media >= v.meta.supermeta) {
          premiacao = combustivel_economizado_meta * v.meta.premiacao_supermeta
        }
      }

      return {
        ...v,
        resumoEventos,
        kmRodados: sumWithPrecision(
          v.consumo.map((c: any) => c.distanceKilometers),
        ),
        litrosConsumidos: sumWithPrecision(
          v.consumo.map((c: any) => c.fuelUsedLitres),
        ),
        media,
        meta_atingida,
        combustivel_economizado_meta: combustivel_economizado_meta.toFixed(2),
        combustivel_economizado_media: combustivel_economizado_media.toFixed(2),
        premiacao: premiacao.toFixed(2),
        count_total_eventos_consumo: v.eventos.reduce(
          (acc: number, evento: any) => {
            if (evento.eventTypeId === 1) {
              return acc + 1
            }
            return acc
          },
          0,
        ),
        count_total_eventos_seguranca: v.eventos.reduce(
          (acc: number, evento: any) => {
            if (evento.eventTypeId === 2) {
              return acc + 1
            }
            return acc
          },
          0,
        ),
      }
    })

    return item
  })

  for (const item of agrupadoPorLinha) {
    item[0].viagens = item[0].viagens.sort((a: any, b: any) => {
      if (a.resumoEventos.seguranca > b.resumoEventos.seguranca) {
        return -1
      }
      if (a.resumoEventos.seguranca < b.resumoEventos.seguranca) {
        return 1
      }
      return 0
    })
    item[0].viagens = item[0].viagens.map((v: any, index: number) => {
      return {
        ...v,
        resumoEventos: {
          ...v.resumoEventos,
          rank_seguranca: index + 1,
        },
      }
    })

    item[0].viagens = item[0].viagens.sort((a: any, b: any) => {
      if (a.resumoEventos.consumo > b.resumoEventos.consumo) {
        return -1
      }
      if (a.resumoEventos.consumo < b.resumoEventos.consumo) {
        return 1
      }
      return 0
    })
    item[0].viagens = item[0].viagens.map((v: any, index: number) => {
      return {
        ...v,
        resumoEventos: {
          ...v.resumoEventos,
          rank_consumo: index + 1,
        },
      }
    })
  }

  const [result1] = await Promise.all([result])

  const resumoEventos: any = {}
  for (const item of trips) {
    for (const evento of item.eventos) {
      if (!resumoEventos[evento.code]) {
        const detalheEvento = await EventTypes.findMixCode(evento.eventTypeId)

        resumoEventos[evento.code] = {
          nome: evento.description,
          quantidade: 0,
          eventTypeId: evento.eventTypeId,
          seguranca: detalheEvento.seguranca,
          consumo: detalheEvento.consumo,
        }
      }
      resumoEventos[evento.code].quantidade =
        resumoEventos[evento.code].quantidade + 1
    }
  }

  return res.json({
    summary: result1,
    distanceKilometers: sumWithPrecision(arrayKm),
    fuelUsedLitres: sumWithPrecision(arrayLitros),
    assetsQuantity: new Set(arrayAssets).size,
    agrupadoPorLinha,
    resumoEventos,
    // arrayIndice,
  })
}

export default {
  index,
}
