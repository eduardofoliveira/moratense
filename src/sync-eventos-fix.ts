import "dotenv/config"
import axios from "axios"
import { format, addHours, subMinutes } from "date-fns"

// import DbMoratense from "./database/connectionManagerHomeLab"
import EventTypes from "./models/EventTypes"
import ApiMix from "./service/api.mix"
import Asset from "./models/Asset"

function dividirLista<T>(lista: T[], tamanho: number): T[][] {
  const resultado = []
  for (let i = 0; i < lista.length; i += tamanho) {
    resultado.push(lista.slice(i, i + tamanho))
  }
  return resultado
}

const execute = async () => {
  const idEmpresa = 4
  const apiMix = await ApiMix.getInstance()
  // const dbMoratense = DbMoratense.getConnection()

  // const [result] = await dbMoratense.raw(`
  //   SELECT
  //     assetId
  //   FROM
  //     assets
  // `)

  const carros = await Asset.getAll()
  const listaDivididaCarros = dividirLista(carros, 100)

  for await (const assets of listaDivididaCarros) {
    const tempAssets = assets.map<string>((asset) => asset.assetId.toString())
    const listaEventTypesCarregar = await EventTypes.getAllActiveItensCarregar({
      id_empresa: idEmpresa,
    })
    const tempEventTypes = listaEventTypesCarregar.map<string>(
      (et) => et.eventTypeId,
    )

    const eventos = await apiMix.getEventByAssets({
      assets: tempAssets,
      tempEventTypes,
      start: format(subMinutes(addHours(new Date(), 3), 240), "yyyyMMddHHmmss"),
      end: format(addHours(new Date(), 3), "yyyyMMddHHmmss"),
      // start: "20250307030000",
      // end: "20250308025959",
    })

    const listaDividida = dividirLista(eventos, 1000)
    for await (const listEnviar of listaDividida) {
      const { data } = await axios.post(
        "http://teleconsult.com.br:3000/data/eventos",
        {
          eventos: listEnviar,
        },
      )
      console.log("Eventos inseridos")
      console.log(data)
    }
  }

  console.log("FIM")
  process.exit(0)
}

execute()
