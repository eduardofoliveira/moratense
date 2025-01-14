import "dotenv/config"
import { format, parseISO, subDays } from "date-fns"

import ApiMix from "./service/api.mix"
import showEmpresa from "./use-cases/empresa/showEmpresa"
import syncMixApi from "./use-cases/telemetriaCarro/syncMixApi"
import showDrankTelConfig from "./use-cases/drankTelConfig/showDrankTelConfig"
import updateDrankTelConfig from "./use-cases/drankTelConfig/updateDrankTelConfig"
import insertDrankTelViagem from "./use-cases/drankTelViagem/insertDrankTelViagem"
import showTelemetriaCarro from "./use-cases/telemetriaCarro/showTelemetriaCarro"
import showDrankTelMotorista from "./use-cases/drankTelMotorista/showDrankTelMotorista"
import insertAuxViagem from "./use-cases/auxViagem/insertAuxViagem"
import insertAuxEvento from "./use-cases/auxEvento/insertAuxEvento"
import showTelemetriaTiposEvento from "./use-cases/telemetriaTiposEvento/showTelemetriaTiposEvento"
import showTelemetriaTiposEventoConverter from "./use-cases/telemetriaTipoEventoConverter/showTelemetriaTiposEventoConverter"
import insertDrankTelEvento from "./use-cases/drankTelEvento/insertDrankTelEvento"
import showAuxEvento from "./use-cases/auxEvento/showAuxEvento"
import insertDrankTelViagemPonto from "./use-cases/drankTelViagensPonto/insertDrankTelViagemPonto"
import insertAuxPosition from "./use-cases/auxPosition/insertAuxPosition"
import showAuxPosition from "./use-cases/auxPosition/showAuxPosition"

function converteDataParaTurno(data: string) {
  const dataObj = new Date(data)
  let dt = format(dataObj, "yyyy-MM-dd")

  const hora = dataObj.getHours()
  const minutos = dataObj.getMinutes()
  const segundos = dataObj.getSeconds()

  if (hora < 2 && minutos < 59 && segundos < 59) {
    dt = format(subDays(parseISO(dt), 1), "yyyy-MM-dd")
  }

  return dt
}

const sincronizarViagens = async ({ token }: { token: number }) => {
  const empresa = await showEmpresa({ id: 4 })

  const apiMix = ApiMix.getInstance()
  await apiMix.getToken()

  const { getsincetoken, viagens } = await apiMix.carregaViagens({
    orgId: BigInt(empresa.mix_groupId),
    token, // 999
  })

  await updateDrankTelConfig({
    name: "sinceTokenTrips",
    value: getsincetoken,
  })

  if (viagens.length === 0) {
    return
  }

  console.log(`Token: ${getsincetoken}`)

  console.log(`Viagens: ${viagens.length}`)
  let count = 0

  for (const viagem of viagens) {
    console.log(`Viagem: ${count++}`)

    if (viagem.SubTrips && viagem.SubTrips.length > 0) {
      for (const subTrip of viagem.SubTrips) {
        if (subTrip.SubTripStart && subTrip.SubTripEnd) {
          const carro = await showTelemetriaCarro({
            codigo_mix: viagem.AssetId.toString(),
          })

          const motorista = await showDrankTelMotorista({
            codigo_mix: viagem.DriverId.toString(),
          })

          const id = await insertDrankTelViagem({
            carro: carro.carro,
            id_empresa: 4,
            id_carro_tel: carro.id as number,
            motorista_cod: motorista ? (motorista.id as number) : 0,
            motorista_nome: motorista ? motorista.nome : "",
            data_ini: new Date(subTrip.SubTripStart),
            data_fim: new Date(subTrip.SubTripEnd),
            km: subTrip.DistanceKilometres,
            combustivel: subTrip.FuelUsedLitres,
            max_kmh: subTrip.MaxSpeedKilometersPerHour,
            subviagem: 1,
            motor_tempo: subTrip.EngineSeconds ? subTrip.EngineSeconds : 0,
            long: subTrip?.StartPosition?.Longitude.toString(),
            lat: subTrip?.StartPosition?.Latitude.toString(),
            data: new Date(),
          })

          await insertAuxViagem({
            asset_id: viagem.AssetId.toString(),
            driver_id: viagem.DriverId.toString(),
            id_drank_tel_viagens: id,
            trip_id: viagem.TripId.toString(),
          })
        }
      }
    } else {
      const carro = await showTelemetriaCarro({
        codigo_mix: viagem.AssetId,
      })

      const motorista = await showDrankTelMotorista({
        codigo_mix: viagem.DriverId,
      })

      const id = await insertDrankTelViagem({
        carro: carro.carro,
        id_empresa: 4,
        id_carro_tel: carro.id as number,
        motorista_cod: motorista ? (motorista.id as number) : 0,
        motorista_nome: motorista ? motorista.nome : "",
        data_ini: new Date(viagem.SubTripStart),
        data_fim: new Date(viagem.SubTripEnd),
        km: viagem.DistanceKilometers,
        combustivel: viagem.FuelUsedLitres,
        max_kmh: viagem.MaxSpeedKilometersPerHour,
        subviagem: 0,
        motor_tempo: viagem.EngineSeconds ? viagem.EngineSeconds : 0,
        long: viagem?.StartPosition?.Longitude.toString(),
        lat: viagem?.StartPosition?.Latitude.toString(),
        data: new Date(),
      })

      await insertAuxViagem({
        asset_id: viagem.AssetId.toString(),
        driver_id: viagem.DriverId.toString(),
        id_drank_tel_viagens: id,
        trip_id: viagem.TripId.toString(),
      })
    }
  }

  await sincronizarViagens({ token: getsincetoken })
}

const sincronizarEventos = async ({ token }: { token: string }) => {
  const empresa = await showEmpresa({ id: 4 })

  const eventosDb = await showTelemetriaTiposEvento({
    id_empresa: 4,
  })

  const eventosConverter = await showTelemetriaTiposEventoConverter({
    id_empresa: 4,
  })

  const codigosEventos = []
  for (const evento of eventosDb) {
    if (
      evento.rank_seguranca === 1 &&
      evento.rank_consulmo === 1 &&
      evento.carregar === 1
    ) {
      codigosEventos.push(evento.codigo)
    }
  }

  const apiMix = ApiMix.getInstance()
  await apiMix.getToken()

  const response = await apiMix.listaEventosCarroPorDataST({
    groupId: empresa.mix_groupId,
    codigosEventos,
    token,
  })

  const eventos = response.eventos
  // const hasmoreitems = response.hasmoreitems
  const getsincetoken = response.getsincetoken

  console.log(`Token: ${getsincetoken}`)
  console.log(`Eventos: ${eventos.length}`)
  let count = 0

  await updateDrankTelConfig({
    name: "sinceTokenEvents",
    value: getsincetoken,
  })

  if (eventos.length === 0) {
    return
  }

  for (const evento of eventos) {
    console.log(`Eventos: ${count++}`)

    const eventoExistDB = await showAuxEvento({
      tripId: evento.EventId.toString(),
    })

    if (eventoExistDB) {
      continue
    }

    const carro = await showTelemetriaCarro({
      codigo_mix: evento.AssetId.toString(),
    })

    const motorista = await showDrankTelMotorista({
      codigo_mix: evento.DriverId.toString(),
    })

    const id_tipo = eventosConverter.find(
      (item) => item.id_mix_entrada === evento.EventTypeId.toString(),
    )

    let long = ""
    let lat = ""

    if (evento.StartPosition) {
      long = evento?.StartPosition?.Longitude.toString()
      lat = evento?.StartPosition?.Latitude.toString()
    }

    const insert = {
      id_empresa: empresa.id as number,
      carro: carro.carro,
      id_carro_tel: carro.id as number,
      id_motorista: motorista ? (motorista.id as number) : 0,
      data_ini: evento.StartDateTime
        ? new Date(evento.StartDateTime)
        : "0000-00-00 00:00:00",
      data_fim:
        evento.TotalTimeSeconds > 0
          ? new Date(evento.EndDateTime)
          : "0000-00-00 00:00:00",
      id_tipo: id_tipo?.id_tipo_saida ? id_tipo?.id_tipo_saida : 0,
      tempo: evento.TotalTimeSeconds,
      quantidades_ocorrencias: evento.TotalOccurances
        ? evento.TotalOccurances
        : 1,
      data_turno_tel: converteDataParaTurno(evento.StartDateTime),
      data: new Date(),
      long,
      lat,
    }

    const id = await insertDrankTelEvento(insert)

    await insertAuxEvento({
      asset_id: evento.AssetId.toString(),
      driver_id: evento.DriverId.toString(),
      event_id: evento.EventId.toString(),
      event_type_id: evento.EventTypeId.toString(),
      id_drank_tel_eventos: id,
    })
  }

  await sincronizarEventos({ token: getsincetoken })
}

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
  let count = 0

  await updateDrankTelConfig({
    name: "sinceTokenPositions",
    value: getsincetoken,
  })

  if (posicoes.length === 0) {
    return
  }

  for await (const posicao of posicoes) {
    console.log(`Pontos: ${count++}`)

    const carro = await showTelemetriaCarro({
      codigo_mix: posicao.AssetId.toString(),
    })

    const positionExistDB = await showAuxPosition({
      positionId: posicao.PositionId.toString(),
    })

    if (positionExistDB) {
      continue
    }

    const insert = {
      id_empresa: empresa.id as number,
      carro: carro.carro,
      km: posicao.SpeedKilometresPerHour,
      long: posicao.Longitude.toString(),
      lat: posicao.Latitude.toString(),
      data: new Date(posicao.Timestamp),
      data_turno: converteDataParaTurno(posicao.Timestamp),
      data_cadastro: new Date(),
    }

    const id = await insertDrankTelViagemPonto(insert)

    await insertAuxPosition({
      asset_id: posicao.AssetId.toString(),
      driver_id: posicao.DriverId.toString(),
      id_drank_tel_viagens_pontos: id,
      position_id: posicao.PositionId.toString(),
    })
  }

  await sincronizarPosicoes({ token: getsincetoken })
}

const executar = async () => {
  // const apiMix = ApiMix.getInstance()
  // await apiMix.getToken()
  // const config = await showDrankTelConfig({ name: "sinceTokenTrips" })
  // await sincronizarViagens({ token: Number.parseInt(config.valor) })
  // console.log("viagens inseridas")
  // const listCarrosApi = await apiMix.listaCarros({
  //   groupId: empresa.mix_groupId,
  // })
  // await syncMixApi({ input: listCarrosApi, idEmpresa: empresa.id as number })
  // console.log(getsincetoken)
  // console.log(viagens[0])
  //
  // console.log({ config })
  // const configEvento = await showDrankTelConfig({ name: "sinceTokenEvents" })
  // await sincronizarEventos({ token: configEvento.valor })
  // console.log("eventos inseridas")
  // setTimeout(async () => {
  //   executar()
  // }, 60000)

  try {
    const configEvento = await showDrankTelConfig({
      name: "sinceTokenPositions",
    })
    await sincronizarPosicoes({ token: configEvento.valor })
    console.log("posições inseridas")
  } catch (error) {
    console.log(error)
  }

  setTimeout(async () => {
    executar()
  }, 60000)
}

executar()
