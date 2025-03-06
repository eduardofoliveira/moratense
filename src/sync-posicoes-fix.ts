import "dotenv/config"
import axios from "axios"

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
  const listaDivididaCarros = dividirLista(carros, 50)

  for await (const assets of listaDivididaCarros) {
    const tempAssets = assets.map<string>((asset) => asset.assetId.toString())

    if (tempAssets.includes("1580750353616416768")) {
      continue
    }
    if (tempAssets.includes("1580749423607418880")) {
      continue
    }

    const posicoes = await apiMix.buscarPosicoesPorCarroData({
      assets: tempAssets,
      start: "20250306025959",
      end: "20250306035959",
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
  }

  console.log("FIM")
}

execute()
