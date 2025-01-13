import "dotenv/config"

import ApiMix from "./service/api.mix"
import showEmpresa from "./use-cases/empresa/showEmpresa"
import syncMixApi from "./use-cases/telemetriaCarro/syncMixApi"
import showDrankTelConfig from "./use-cases/drankTelConfig/showDrankTelConfig"
import updateDrankTelConfig from "./use-cases/drankTelConfig/updateDrankTelConfig"
import insertDrankTelViagem from "./use-cases/drankTelViagem/insertDrankTelViagem"
import showTelemetriaCarro from "./use-cases/telemetriaCarro/showTelemetriaCarro"
import showDrankTelMotorista from "./use-cases/drankTelMotorista/showDrankTelMotorista"
import insertAuxViagem from "./use-cases/auxViagem/insertAuxViagem"

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
            data_ini: new Date(subTrip.SubTripStart),
            data_fim: new Date(subTrip.SubTripEnd),
            km: subTrip.DistanceKilometres,
            combustivel: subTrip.FuelUsedLitres,
            max_kmh: subTrip.MaxSpeedKilometersPerHour,
            subviagem: 1,
            motor_tempo: subTrip.EngineSeconds ? subTrip.EngineSeconds : 0,
            long: subTrip?.StartPosition?.Longitude,
            lat: subTrip?.StartPosition?.Latitude,
            data: new Date(),
          })

          await insertAuxViagem({
            asset_id: viagem.AssetId,
            driver_id: viagem.DriverId,
            id_drank_tel_viagens: id,
            trip_id: viagem.TripId,
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
        long: viagem?.StartPosition?.Longitude,
        lat: viagem?.StartPosition?.Latitude,
        data: new Date(),
      })

      await insertAuxViagem({
        asset_id: viagem.AssetId,
        driver_id: viagem.DriverId,
        id_drank_tel_viagens: id,
        trip_id: viagem.TripId,
      })
    }
  }

  await sincronizarViagens({ token: getsincetoken })
}

const executar = async () => {
  // const apiMix = ApiMix.getInstance()
  // await apiMix.getToken()

  await sincronizarViagens({ token: 20250107000000 })
  console.log("viagens inseridas")

  // const listCarrosApi = await apiMix.listaCarros({
  //   groupId: empresa.mix_groupId,
  // })
  // await syncMixApi({ input: listCarrosApi, idEmpresa: empresa.id as number })

  // console.log(getsincetoken)
  // console.log(viagens[0])

  // const config = await showDrankTelConfig({ name: "sinceTokenTrips" })
  // console.log({ config })
}

executar()
