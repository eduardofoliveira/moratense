import { addHours, format, subHours } from "date-fns"
import type { Request, Response } from "express"

import Summary from "../models/Summary"
import Meta from "../models/moratense/Meta"

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
  const todosEventos = await Summary.getEventsByInterval({
    start: format(new Date(start as string), "yyyy-MM-dd 03:00:00"),
    end: format(new Date(end as string), "yyyy-MM-dd 23:59:59"),
  })

  for await (const trip of trips) {
    const consumo = await Summary.getConsumption({
      assetId: trip.assetId,
      driverId: trip.driverId,
      start: format(new Date(trip.data_saida_garagem), "yyyy-MM-dd HH:mm:ss"),
      end: format(new Date(trip.data_recolhido), "yyyy-MM-dd HH:mm:ss"),
    })

    const eventos = todosEventos.filter((evento: any) => {
      return (
        evento.assetId === trip.assetId && evento.driverId === trip.driverId
      )
    })
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
    trip.eventos = eventos
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
      const media =
        sumWithPrecision(v.consumo.map((c: any) => c.distanceKilometers)) /
        sumWithPrecision(v.consumo.map((c: any) => c.fuelUsedLitres))

      if (v.meta) {
        if (media >= v.meta.meta) {
          meta_atingida = `${(v.meta.premiacao_meta * 100).toFixed(0)}%`
        }
        if (media >= v.meta.supermeta) {
          meta_atingida = `${(v.meta.premiacao_supermeta * 100).toFixed(0)}%`
        }
      }

      return {
        ...v,
        kmRodados: sumWithPrecision(
          v.consumo.map((c: any) => c.distanceKilometers),
        ),
        litrosConsumidos: sumWithPrecision(
          v.consumo.map((c: any) => c.fuelUsedLitres),
        ),
        media,
        meta_atingida,
      }
    })

    return item
  })

  const [result1] = await Promise.all([result])

  return res.json({
    summary: result1,
    distanceKilometers: sumWithPrecision(arrayKm),
    fuelUsedLitres: sumWithPrecision(arrayLitros),
    assetsQuantity: new Set(arrayAssets).size,
    agrupadoPorLinha,
    // arrayIndice,
  })
}

export default {
  index,
}
