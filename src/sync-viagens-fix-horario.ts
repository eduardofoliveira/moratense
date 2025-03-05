import "dotenv/config"
import axios from "axios"
import { format, subHours } from "date-fns"

import DbTeleconsult from "./database/connectionManager"
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
    start: "20250305200000",
    end: "20250305210000",
  })

  viagens = viagens.map((viagem: any) => {
    viagem.TripStart = format(
      subHours(new Date(viagem.TripStart), 5),
      "yyyy-MM-dd HH:mm:ss",
    )
    viagem.TripEnd = format(
      subHours(new Date(viagem.TripEnd), 5),
      "yyyy-MM-dd HH:mm:ss",
    )

    return viagem
  })

  console.log(JSON.stringify(viagens, null, 2))

  await axios
    .post("http://teleconsult.com.br:3000/data/viagens", {
      viagens,
    })
    .then(({ data }) => {
      console.log("Viagens inseridas")
      console.log(data)
    })
}

execute()
