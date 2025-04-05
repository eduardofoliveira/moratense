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
  // const inicio = parse("01-03-2025 00:00:00", "dd-MM-yyyy HH:mm:ss", new Date())
  // const fim = parse("15-03-2025 23:59:59", "dd-MM-yyyy HH:mm:ss", new Date())

  // const idEmpresa = 4
  // const apiMix = await ApiMix.getInstance()
  // const carros = await Asset.getAll()
  // const listaDivididaCarros = dividirLista(carros, 100)

  // let data = inicio
  // while (isBefore(data, fim)) {
  //   console.log({
  //     start: format(subHours(startOfDay(data), 3), "yyyyMMddHHmmss"),
  //     end: format(subHours(endOfDay(data), 3), "yyyyMMddHHmmss"),
  //   })

  //   for await (const assets of listaDivididaCarros) {
  //     const tempAssets = assets.map<string>((asset) => asset.assetId.toString())
  //     const listaEventTypesCarregar =
  //       await EventTypes.getAllActiveItensCarregar({
  //         id_empresa: idEmpresa,
  //       })
  //     const tempEventTypes = listaEventTypesCarregar.map<string>(
  //       (et) => et.eventTypeId,
  //     )
  //     const eventos = await apiMix.getEventByAssets({
  //       assets: tempAssets,
  //       tempEventTypes,
  //       start: format(subHours(startOfDay(data), 3), "yyyyMMddHHmmss"),
  //       end: format(subHours(endOfDay(data), 3), "yyyyMMddHHmmss"),
  //     })

  //     let cont = 0
  //     const listaDividida = dividirLista(eventos, 100)
  //     const total = listaDividida.length
  //     for await (const listEnviar of listaDividida) {
  //       console.log(`Enviando ${cont++} de ${total}`)

  //       try {
  //         const { data: wsResult } = await axios.post(
  //           "http://teleconsult.com.br:3000/data/eventos",
  //           {
  //             eventos: listEnviar,
  //           },
  //         )
  //         console.log("Eventos inseridos")
  //         console.log(wsResult)
  //       } catch (error) {
  //         console.log("Erro ao inserir eventos")
  //         console.log(error)
  //       }
  //     }
  //   }

  //   data = addDays(data, 1)
  // }

  const idEmpresa = 4
  const apiMix = await ApiMix.getInstance()
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
      // start: format(subMinutes(addHours(new Date(), 3), 240), "yyyyMMddHHmmss"),
      // end: format(addHours(new Date(), 3), "yyyyMMddHHmmss"),
      start: "20250403200000",
      end: "20250404022100",
    })
    const listaDividida = dividirLista(eventos, 100)

    const total = listaDividida.length
    let cont = 0
    for await (const listEnviar of listaDividida) {
      console.log(`Enviando ${cont++} de ${total}`)

      try {
        const { data } = await axios.post(
          "http://teleconsult.com.br:3000/data/eventos",
          {
            eventos: listEnviar,
          },
          {
            timeout: 30000,
          },
        )
        console.log("Eventos inseridos")
        console.log(data)
      } catch (error) {
        console.error("Erro ao inserir eventos")
      }
    }
  }
  console.log("FIM")
  process.exit(0)
}

execute()
