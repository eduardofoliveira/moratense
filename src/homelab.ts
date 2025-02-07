import "dotenv/config"
import { addHours } from "date-fns"

import ApiMix from "./service/api.mix"
import showEmpresa from "./use-cases/empresa/showEmpresa"
import Driver from "./models/Driver"
import Asset from "./models/Asset"
import Position from "./models/Position"
import Trip from "./models/Trip"
import EventTypes from "./models/EventTypes"

const syncDrivers = async () => {
  try {
    const empresa = await showEmpresa({ id: 4 })
    const apiMix = ApiMix.getInstance()
    await apiMix.getToken()

    const motoristas = await apiMix.listaMotoristas({
      groupId: empresa.mix_groupId,
    })

    for await (const motorista of motoristas) {
      const driver = await Driver.findMixCode(motorista.DriverId.toString())
      if (driver) {
        await Driver.update(driver.id, {
          fmDriverId: motorista.FmDriverId,
          driverId: motorista.DriverId.toString(),
          siteId: motorista.SiteId.toString(),
          country: motorista.Country ? motorista.Country : "BR",
          employeeNumber: Number.parseInt(motorista.EmployeeNumber, 10)
            ? Number.parseInt(motorista.EmployeeNumber, 10)
            : 0,
          name: motorista.Name,
          created_at: new Date(),
        })
      } else {
        await Driver.create({
          fmDriverId: motorista.FmDriverId,
          driverId: motorista.DriverId.toString(),
          siteId: motorista.SiteId.toString(),
          country: motorista.Country ? motorista.Country : "BR",
          employeeNumber: Number.parseInt(motorista.EmployeeNumber, 10)
            ? Number.parseInt(motorista.EmployeeNumber, 10)
            : 0,
          name: motorista.Name,
        })
      }
    }

    console.log("syncDrivers: Fim")
  } catch (error) {
    console.error(error)
  }
}

const syncAssets = async () => {
  try {
    const empresa = await showEmpresa({ id: 4 })
    const apiMix = ApiMix.getInstance()
    await apiMix.getToken()

    const carros = await apiMix.listaCarros({
      groupId: empresa.mix_groupId,
    })

    for await (const carro of carros) {
      const asset = await Asset.findMixCode(carro.AssetId.toString())
      if (asset) {
        await Asset.update(asset.id, {
          assetId: carro.AssetId.toString(),
          siteId: carro.SiteId.toString(),
          country: carro.Country ? carro.Country : "BR",
          createdBy: carro.CreatedBy,
          userState: carro.UserState,
          assetImageUrl: carro.AssetImageUrl,
          assetImage: carro.AssetImage,
          iconColour: carro.IconColour,
          icon: carro.Icon,
          vinNumber: carro.VinNumber,
          year: carro.Year,
          model: carro.Model,
          make: carro.Make,
          targetHourlyFuelConsumptionUnits:
            carro.TargetHourlyFuelConsumptionUnits,
          targetFuelConsumptionUnits: carro.TargetFuelConsumptionUnits,
          fuelType: carro.FuelType,
          registrationNumber: carro.RegistrationNumber,
          description: carro.Description,
          defaultDriverId: carro.DefaultDriverId.toString(),
          assetTypeId: carro.AssetTypeId,
          isDefaultImage: carro.IsDefaultImage,
          engineHours: carro.EngineHours,
          odometer: carro.Odometer,
          fmVehicleId: carro.FmVehicleId,
          updated_at: new Date(),
        })
      } else {
        await Asset.create({
          assetId: carro.AssetId.toString(),
          siteId: carro.SiteId.toString(),
          country: carro.Country ? carro.Country : "BR",
          createdBy: carro.CreatedBy,
          userState: carro.UserState,
          assetImageUrl: carro.AssetImageUrl,
          assetImage: carro.AssetImage,
          iconColour: carro.IconColour,
          icon: carro.Icon,
          vinNumber: carro.VinNumber,
          year: carro.Year,
          model: carro.Model,
          make: carro.Make,
          targetHourlyFuelConsumptionUnits:
            carro.TargetHourlyFuelConsumptionUnits,
          targetFuelConsumptionUnits: carro.TargetFuelConsumptionUnits,
          fuelType: carro.FuelType,
          registrationNumber: carro.RegistrationNumber,
          description: carro.Description,
          defaultDriverId: carro.DefaultDriverId.toString(),
          assetTypeId: carro.AssetTypeId,
          isDefaultImage: carro.IsDefaultImage,
          engineHours: carro.EngineHours,
          odometer: carro.Odometer,
          fmVehicleId: carro.FmVehicleId,
        })
      }
    }

    console.log("syncAssets: Fim")
  } catch (error) {
    console.error(error)
  }
}

function dividirLista<T>(lista: T[], tamanho: number): T[][] {
  const resultado = []
  for (let i = 0; i < lista.length; i += tamanho) {
    resultado.push(lista.slice(i, i + tamanho))
  }
  return resultado
}

const syncPositionsByAsset = async () => {
  try {
    const empresa = await showEmpresa({ id: 4 })
    const apiMix = ApiMix.getInstance()
    await apiMix.getToken()

    const carros = await Asset.getAll()

    // let ignore = false
    // carros = carros.filter((carro) => {
    //   if (carro.description === "1314") {
    //     ignore = true
    //   }
    //   return ignore
    // })

    const listaDividida = dividirLista(carros, 37)
    for await (const assets of listaDividida) {
      const tempAssets = assets.map<string>((asset) => asset.assetId.toString())

      const positions = await apiMix.buscarPosicoesPorCarroData({
        assets: tempAssets,
        start: "20250206000000",
        end: "20250206035959",
      })

      for await (const position of positions) {
        try {
          await Position.create({
            positionId: position.PositionId.toString(),
            driverId: position.DriverId.toString(),
            assetId: position.AssetId.toString(),
            lat: position.Latitude.toString(),
            long: position.Longitude.toString(),
            km: position.SpeedKilometresPerHour,
            data: addHours(new Date(position.Timestamp), 3),
          })
        } catch (error) {
          // se houver erro a posição existe
        }
      }
    }

    console.log("syncPosicoesPorCarro: Fim")
  } catch (error) {
    console.error(error)
  }
}

const syncTrips = async () => {
  try {
    const empresa = await showEmpresa({ id: 4 })
    const apiMix = ApiMix.getInstance()
    await apiMix.getToken()

    const carros = await Asset.getAll()
    // carros = carros.filter((carro) => carro.assetId === "1580750191846305792")
    const listaDividida = dividirLista(carros, 37)

    for await (const assets of listaDividida) {
      const tempAssets = assets.map<string>((asset) => asset.assetId.toString())

      console.log(tempAssets)

      const trips = await apiMix.getTripsByAsset({
        assets: tempAssets,
        start: "20250205000000",
        end: "20250205235959",
      })

      for await (const trip of trips) {
        try {
          await Trip.create({
            assetId: trip.AssetId.toString(),
            driverId: trip.DriverId.toString(),
            tripId: trip.TripId.toString(),
            startPositionId: trip.StartPositionId.toString(),
            endPositionId: trip.EndPositionId.toString(),
            distanceKilometers: trip.DistanceKilometers,
            duration: trip.Duration,
            drivingTime: trip.DrivingTime,
            maxRpm: trip.MaxRpm,
            lastHalt: addHours(new Date(trip.LastHalt), 3),
            firstDepart: addHours(new Date(trip.FirstDepart), 3),
            endEngineSeconds: trip.EndEngineSeconds,
            endOdometerKilometers: trip.EndOdometerKilometers,
            engineSeconds: trip.EngineSeconds,
            fuelUsedLitres: trip.FuelUsedLitres,
            maxAccelerationKilometersPerHourPerSecond:
              trip.MaxAccelerationKilometersPerHourPerSecond,
            maxDecelerationKilometersPerHourPerSecond:
              trip.MaxDecelerationKilometersPerHourPerSecond,
            maxSpeedKilometersPerHour: trip.MaxSpeedKilometersPerHour,
            standingTime: trip.StandingTime,
            startEngineSeconds: trip.StartEngineSeconds,
            startOdometerKilometers: trip.StartOdometerKilometers,
            tripEnd: addHours(new Date(trip.TripEnd), 3),
            tripStart: addHours(new Date(trip.TripStart), 3),
          })
        } catch (error) {
          //
        }
      }
    }

    console.log("syncTrips: Fim")
  } catch (error) {
    console.error(error)
  }
}

const eventTypes = async () => {
  try {
    const idEmpresa = 4
    const empresa = await showEmpresa({ id: idEmpresa })
    const apiMix = ApiMix.getInstance()
    await apiMix.getToken()

    const eventTypes = await apiMix.getEventTypes({
      orgId: empresa.mix_groupId,
    })

    for await (const eventType of eventTypes) {
      const et = await EventTypes.findMixCode(eventType.EventTypeId.toString())
      if (et) {
        await EventTypes.update(et.id, {
          eventTypeId: eventType.EventTypeId.toString(),
          valueName: eventType.ValueName,
          formatType: eventType.FormatType,
          displayUnits: eventType.DisplayUnits,
          eventType: eventType.EventType,
          description: eventType.Description,
          id_empresa: idEmpresa,
          created_at: new Date(),
        })
      } else {
        await EventTypes.create({
          eventTypeId: eventType.EventTypeId.toString(),
          valueName: eventType.ValueName,
          formatType: eventType.FormatType,
          displayUnits: eventType.DisplayUnits,
          eventType: eventType.EventType,
          description: eventType.Description,
          id_empresa: idEmpresa,
        })
      }
    }

    console.log("syncTrips: Fim")
  } catch (error) {
    console.error(error)
  }
}

// syncDrivers()
// syncAssets()
// syncPositionsByAsset()
// syncTrips()
eventTypes()
