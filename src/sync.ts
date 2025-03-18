import "dotenv/config"
import axios from "axios"
import lockfile from "proper-lockfile"
import { format, subHours } from "date-fns"

import showTelemetriaTiposEvento from "./use-cases/telemetriaTiposEvento/showTelemetriaTiposEvento"
import updateDrankTelConfig from "./use-cases/drankTelConfig/updateDrankTelConfig"
import showDrankTelConfig from "./use-cases/drankTelConfig/showDrankTelConfig"
import showEmpresa from "./use-cases/empresa/showEmpresa"
import ApiMix from "./service/api.mix"

const sincronizarPosicoes = async ({ token }: { token: string }) => {
  const empresa = await showEmpresa({ id: 4 })

  const apiMix = await ApiMix.getInstance()
  // await apiMix.getToken()

  const response = await apiMix.listarPosicoes({
    groupId: empresa.mix_groupId,
    token,
  })

  const { getsincetoken, hasmoreitems, posicoes, status } = response

  console.log(`Token: ${getsincetoken}`)
  console.log(`Posições: ${posicoes.length}`)
  console.log({ status })

  axios
    .post("http://teleconsult.com.br:3000/data/posicoes", {
      posicoes,
    })
    .then(({ data }) => {
      console.log("Posições inseridos")
      console.log(data)
    })

  await updateDrankTelConfig({
    name: "sinceTokenPositions",
    value: getsincetoken,
  })

  if (response.status === 206) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    await sincronizarPosicoes({ token: getsincetoken })
  }
  // if (response.status === 200) {
  //   setTimeout(async () => {
  //     await sincronizarPosicoes({ token: getsincetoken })
  //   }, 60000)
  // }
}

const executarPosicoes = async () => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const configEvento = await showDrankTelConfig({
      name: "sinceTokenPositions",
    })
    await sincronizarPosicoes({ token: configEvento.valor })
    console.log("posições inseridas")
  } catch (error) {
    console.log(error)

    // setTimeout(async () => {
    //   executarPosicoes()
    // }, 60000)
  }
}

const sincronizarEventos = async ({ token }: { token: string }) => {
  const empresa = await showEmpresa({ id: 4 })

  const eventosDb = await showTelemetriaTiposEvento({
    id_empresa: 4,
  })

  const codigosEventos = []
  for (const evento of eventosDb) {
    if (evento.carregar === 1) {
      codigosEventos.push(evento.codigo)
    }
  }

  const apiMix = await ApiMix.getInstance()
  // await apiMix.getToken()

  const response = await apiMix.listaEventosCarroPorDataST({
    groupId: empresa.mix_groupId,
    codigosEventos,
    token,
  })

  const eventos = response.eventos
  const getsincetoken = response.getsincetoken

  console.log(response.status)
  console.log(`Token: ${getsincetoken}`)
  console.log(`Eventos: ${eventos.length}`)

  await axios
    .post("http://teleconsult.com.br:3000/data/eventos", {
      eventos,
    })
    .then(({ data }) => {
      console.log("Eventos inseridos")
      console.log(data)
    })

  await updateDrankTelConfig({
    name: "sinceTokenEvents",
    value: getsincetoken,
  })

  if (response.status === 206) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    await sincronizarEventos({ token: getsincetoken })
  }
  // if (response.status === 200) {
  //   setTimeout(async () => {
  //     await sincronizarEventos({ token: getsincetoken })
  //   }, 60000)
  // }
}

const executarEventos = async () => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const configEvento = await showDrankTelConfig({ name: "sinceTokenEvents" })
    await sincronizarEventos({ token: configEvento.valor })
    console.log("eventos inseridas")
  } catch (error) {
    console.error(error)

    // setTimeout(async () => {
    //   executarEventos()
    // }, 60000)
  }
}

const sincronizarViagens = async ({ token }: { token: number }) => {
  const empresa = await showEmpresa({ id: 4 })

  const apiMix = await ApiMix.getInstance()
  // await apiMix.getToken()

  const { getsincetoken, viagens, status } = await apiMix.carregaViagens({
    orgId: BigInt(empresa.mix_groupId),
    token, // 999
  })

  console.log(status)
  console.log(`Token: ${getsincetoken}`)
  console.log(`Eventos: ${viagens.length}`)

  // const subTripFix = (subTrip: any) => {
  //   if (subTrip?.SubTripStart) {
  //     subTrip.SubTripStart = format(
  //       subHours(new Date(subTrip.SubTripStart), 5),
  //       "yyyy-MM-dd HH:mm:ss",
  //     )
  //   }
  //   if (subTrip?.SubTripEnd) {
  //     subTrip.SubTripEnd = format(
  //       subHours(new Date(subTrip.SubTripEnd), 5),
  //       "yyyy-MM-dd HH:mm:ss",
  //     )
  //   }

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
  // const viagensComHorarioCorreto = viagens.map(tripFix)

  await axios
    .post("http://teleconsult.com.br:3000/data/viagens", {
      viagens,
    })
    .then(({ data }) => {
      console.log("Viagens inseridas")
      console.log(data)
    })

  await updateDrankTelConfig({
    name: "sinceTokenTrips",
    value: getsincetoken,
  })

  if (status === 206) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    await sincronizarViagens({ token: getsincetoken })
  }
}

const executarViagens = async () => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const config = await showDrankTelConfig({ name: "sinceTokenTrips" })
    await sincronizarViagens({ token: Number.parseInt(config.valor) })
    console.log("viagens inseridas")
  } catch (error) {
    console.error(error)
  }
}

const executar = async () => {
  await Promise.all([executarEventos(), executarPosicoes(), executarViagens()])
  process.exit(0)
}

lockfile
  .lock("sync.lock")
  .then((release: any) => {
    console.log("Iniciando o programa...")

    process.on("exit", release)
    process.on("SIGINT", () => {
      release()
      process.exit()
    })

    executar()
  })
  .catch((err: any) => {
    console.log("O programa já está em execução.")
    process.exit(1)
  })
