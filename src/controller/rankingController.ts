import { addHours, format, subHours } from "date-fns"
import type { Request, Response } from "express"

import Summary from "../models/Summary"

const index = async (req: Request, res: Response): Promise<any> => {
  const { start, end } = req.query

  const result = Summary.getSummary({
    start: start as string,
    end: end as string,
  })

  const trips = await Summary.getTrips({
    start: start as string,
    end: end as string,
  })

  for await (const trip of trips) {
    const consumo = await Summary.getConsumption({
      assetId: trip.assetId,
      driverId: trip.driverId,
      start: format(new Date(trip.data_saida_garagem), "yyyy-MM-dd HH:mm:ss"),
      end: format(new Date(trip.data_recolhido), "yyyy-MM-dd HH:mm:ss"),
    })

    trip.consumo = consumo

    trip.data_saida_garagem = format(
      new Date(trip.data_saida_garagem),
      "dd-MM-yyyy HH:mm:ss",
    )
    trip.data_recolhido = format(
      new Date(trip.data_recolhido),
      "dd-MM-yyyy HH:mm:ss",
    )
  }

  // const filtredTrips = trips.filter((trip) => trip.consumo.length > 0)
  const [result1] = await Promise.all([result])

  return res.json({
    summary: result1,
    trips: trips,
  })
}

export default {
  index,
}
