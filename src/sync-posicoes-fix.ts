import "dotenv/config"
import axios from "axios"
import { format, addHours, subMinutes } from "date-fns"

import Asset from "./models/Asset"
import ApiMix from "./service/api.mix"
import showEmpresa from "./use-cases/empresa/showEmpresa"

function dividirLista<T>(lista: T[], tamanho: number): T[][] {
  const resultado = []
  for (let i = 0; i < lista.length; i += tamanho) {
    resultado.push(lista.slice(i, i + tamanho))
  }
  return resultado
}

const execute = async () => {
  const empresa = await showEmpresa({ id: 4 })
  const apiMix = await ApiMix.getInstance()

  const carros = await Asset.getAll()
  // const listaDivididaCarros = dividirLista(carros, 50)

  // for await (const assets of listaDivididaCarros) {
  const tempAssets = carros.map<string>((asset) => asset.assetId.toString())

  const posicoes = await apiMix.buscarPosicoesPorCarroData({
    assets: tempAssets,
    start: format(subMinutes(addHours(new Date(), 3), 20), "yyyyMMddHHmmss"),
    end: format(addHours(new Date(), 3), "yyyyMMddHHmmss"),
    // start: "20250306140700",
    // end: "20250306141800",
  })

  const listaDividida = dividirLista(posicoes, 1000)
  for await (const listEnviar of listaDividida) {
    const { data } = await axios.post(
      "http://teleconsult.com.br:3000/data/posicoes",
      {
        posicoes: listEnviar,
      },
    )
    console.log("Posições inseridos")
    console.log(data)
  }
  // }

  console.log("FIM")
}

execute()
