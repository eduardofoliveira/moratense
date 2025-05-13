import "dotenv/config"
import axios from "axios"
import {
  format,
  subHours,
  addHours,
  subMinutes,
  endOfDay,
  parse,
  addDays,
  startOfDay,
  isBefore,
} from "date-fns"

import DbMoratense from "./database/connectionManagerHomeLab"
import ApiMix from "./service/api.mix"

const execute = async () => {
  // const inicio = parse("01-02-2025 00:00:00", "dd-MM-yyyy HH:mm:ss", new Date())
  // const fim = parse("15-03-2025 23:59:59", "dd-MM-yyyy HH:mm:ss", new Date())

  // let data = inicio
  // while (isBefore(data, fim)) {
  //   console.log({
  //     start: format(subHours(startOfDay(data), 3), "yyyyMMddHHmmss"),
  //     end: format(subHours(endOfDay(data), 3), "yyyyMMddHHmmss"),
  //   })

  //   const apiMix = await ApiMix.getInstance()
  //   const dbMoratense = DbMoratense.getConnection()
  //   const [result] = await dbMoratense.raw(`
  //     SELECT
  //       assetId
  //     FROM
  //       assets
  //   `)
  //   const viagens = await apiMix.getTripsByAsset({
  //     assets: result.map((r: any) => r.assetId),
  //     start: format(subHours(startOfDay(data), 3), "yyyyMMddHHmmss"),
  //     end: format(subHours(endOfDay(data), 3), "yyyyMMddHHmmss"),
  //   })
  //   const { data: wsReturn } = await axios.post(
  //     "http://teleconsult.com.br:3000/data/viagens",
  //     {
  //       viagens,
  //     },
  //   )
  //   console.log("Viagens inseridas")
  //   console.log(wsReturn)
  //   data = addDays(data, 1)
  // }

  const apiMix = await ApiMix.getInstance()
  const dbMoratense = DbMoratense.getConnection()
  const [result] = await dbMoratense.raw(`
    SELECT
      assetId
    FROM
      assets
    WHERE
      assetId not in ('1599384190004375552')
  `)
  const viagens = await apiMix.getTripsByAsset({
    assets: result.map((r: any) => r.assetId),
    // start: format(subMinutes(addHours(new Date(), 3), 240), "yyyyMMddHHmmss"),
    // end: format(addHours(new Date(), 3), "yyyyMMddHHmmss"),
    start: "20250513000000",
    end: "20250513235959",
  })
  // const subTripFix = (subTrip: any) => {
  //   subTrip.SubTripStart = format(
  //     subHours(new Date(subTrip.SubTripStart), 5),
  //     "yyyy-MM-dd HH:mm:ss",
  //   )
  //   subTrip.SubTripEnd = format(
  //     subHours(new Date(subTrip.SubTripEnd), 5),
  //     "yyyy-MM-dd HH:mm:ss",
  //   )
  //   return
  // }
  // const tripFix = (viagem: any) => {
  //   viagem.TripStart = format(
  //     subHours(new Date(viagem.TripStart), 5),
  //     "yyyy-MM-dd HH:mm:ss",
  //   )
  //   viagem.TripEnd = format(
  //     subHours(new Date(viagem.TripEnd), 5),
  //     "yyyy-MM-dd HH:mm:ss",
  //   )
  //   viagem.SubTrips = viagem.SubTrips.map(subTripFix)
  //   return viagem
  // }
  // viagens = viagens.map(tripFix)
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
