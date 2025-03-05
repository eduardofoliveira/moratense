import type { Request, Response } from "express"

import showAuxViagem from "../use-cases/auxViagem/showAuxViagem"
import showDrankTelMotorista from "../use-cases/drankTelMotorista/showDrankTelMotorista"
import showTelemetriaCarro from "../use-cases/telemetriaCarro/showTelemetriaCarro"
import insertDrankTelViagem from "../use-cases/drankTelViagem/insertDrankTelViagem"
import insertAuxViagem from "../use-cases/auxViagem/insertAuxViagem"

const batchInsert = async (req: Request, res: Response): Promise<any> => {
  const { viagens } = req.body

  let count = 0
  for (const viagem of viagens) {
    try {
      console.log(`Viagem: ${count++}`)

      const dbExists = await showAuxViagem({ tripId: viagem.TripId.toString() })
      if (dbExists) {
        continue
      }

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
              motorista_cod: motorista
                ? (motorista.codigo_motorista as number)
                : 0,
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
          motorista_cod: motorista ? (motorista.codigo_motorista as number) : 0,
          motorista_nome: motorista ? motorista.nome : "",
          data_ini: new Date(viagem.TripStart),
          data_fim: new Date(viagem.TripEnd),
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
    } catch (error) {
      console.error(error)
    }
  }

  return res.send({ message: "Dados inseridos com sucesso" })
}

export default {
  batchInsert,
}
