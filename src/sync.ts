import "dotenv/config"
import axios from "axios"

import updateDrankTelConfig from "./use-cases/drankTelConfig/updateDrankTelConfig"
import showDrankTelConfig from "./use-cases/drankTelConfig/showDrankTelConfig"
import showEmpresa from "./use-cases/empresa/showEmpresa"
import ApiMix from "./service/api.mix"

const sincronizarPosicoes = async ({ token }: { token: string }) => {
  const empresa = await showEmpresa({ id: 4 })

  const apiMix = ApiMix.getInstance()
  await apiMix.getToken()

  const response = await apiMix.listarPosicoes({
    groupId: empresa.mix_groupId,
    token,
  })

  const { getsincetoken, hasmoreitems, posicoes } = response

  console.log(`Token: ${getsincetoken}`)
  console.log(`Posições: ${posicoes.length}`)

  const { data } = await axios.post(
    "http://teleconsult.com.br:3000/data/posicoes",
    {
      posicoes,
    },
  )

  console.log(data)

  await updateDrankTelConfig({
    name: "sinceTokenPositions",
    value: getsincetoken,
  })

  await sincronizarPosicoes({ token: getsincetoken })
}

const executar = async () => {
  try {
    const configEvento = await showDrankTelConfig({
      name: "sinceTokenPositions",
    })
    await sincronizarPosicoes({ token: configEvento.valor })
    console.log("posições inseridas")
  } catch (error) {
    console.log(error)

    setTimeout(async () => {
      executar()
    }, 60000)
  }
}

executar()
