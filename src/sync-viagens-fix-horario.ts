import "dotenv/config"
import axios from "axios"
import { format, subHours, addHours, subMinutes } from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"
import ApiMix from "./service/api.mix"

const execute = async () => {
  const apiMix = await ApiMix.getInstance()
  const dbMoratense = DbMoratense.getConnection()

  const [result] = await dbMoratense.raw(`
    SELECT
      assetId
    FROM
      assets
  `)

  let viagens = await apiMix.getTripsByAsset({
    assets: result.map((r: any) => r.assetId),
    // start: format(subMinutes(addHours(new Date(), 3), 240), "yyyyMMddHHmmss"),
    // end: format(addHours(new Date(), 3), "yyyyMMddHHmmss"),
    start: "20250307030000",
    end: "20250308025959",
  })

  const subTripFix = (subTrip: any) => {
    subTrip.SubTripStart = format(
      subHours(new Date(subTrip.SubTripStart), 5),
      "yyyy-MM-dd HH:mm:ss",
    )
    subTrip.SubTripEnd = format(
      subHours(new Date(subTrip.SubTripEnd), 5),
      "yyyy-MM-dd HH:mm:ss",
    )
    return
  }
  const tripFix = (viagem: any) => {
    viagem.TripStart = format(
      subHours(new Date(viagem.TripStart), 5),
      "yyyy-MM-dd HH:mm:ss",
    )
    viagem.TripEnd = format(
      subHours(new Date(viagem.TripEnd), 5),
      "yyyy-MM-dd HH:mm:ss",
    )
    viagem.SubTrips = viagem.SubTrips.map(subTripFix)

    return viagem
  }
  viagens = viagens.map(tripFix)

  const { data } = await axios.post(
    "http://teleconsult.com.br:3000/data/viagens",
    {
      viagens,
    },
  )
  console.log("Viagens inseridas")
  console.log(data)

  console.log("FIM")
  process.exit(0)
}

execute()
