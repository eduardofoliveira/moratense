import { addHours, format, subHours } from "date-fns"
import type { Request, Response } from "express"

import Summary from "../models/Summary"

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
  for await (const trip of trips) {
    const consumo = await Summary.getConsumption({
      assetId: trip.assetId,
      driverId: trip.driverId,
      start: format(new Date(trip.data_saida_garagem), "yyyy-MM-dd HH:mm:ss"),
      end: format(new Date(trip.data_recolhido), "yyyy-MM-dd HH:mm:ss"),
    })

    trip.consumo = consumo

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
  const [result1] = await Promise.all([result])

  return res.json({
    summary: result1,
    distanceKilometers: sumWithPrecision(arrayKm),
    fuelUsedLitres: sumWithPrecision(arrayLitros),
    trips: trips,
  })
}

export default {
  index,
}
