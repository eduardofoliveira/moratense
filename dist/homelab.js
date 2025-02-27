"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const api_mix_1 = __importDefault(require("./service/api.mix"));
const showEmpresa_1 = __importDefault(require("./use-cases/empresa/showEmpresa"));
const Driver_1 = __importDefault(require("./models/Driver"));
const Asset_1 = __importDefault(require("./models/Asset"));
const Position_1 = __importDefault(require("./models/Position"));
const Trip_1 = __importDefault(require("./models/Trip"));
const EventTypes_1 = __importDefault(require("./models/EventTypes"));
const Event_1 = __importDefault(require("./models/Event"));
const today = new Date();
// const start = format(subDays(today, 1), "yyyyMMdd000000")
// const end = format(subDays(today, 1), "yyyyMMdd235959")
const start = "20250216030000";
const end = "20250218025959";
const syncDrivers = async () => {
    try {
        const empresa = await (0, showEmpresa_1.default)({ id: 4 });
        const apiMix = api_mix_1.default.getInstance();
        await apiMix.getToken();
        const motoristas = await apiMix.listaMotoristas({
            groupId: empresa.mix_groupId,
        });
        for await (const motorista of motoristas) {
            const driver = await Driver_1.default.findMixCode(motorista.DriverId.toString());
            if (driver) {
                await Driver_1.default.update(driver.id, {
                    fmDriverId: motorista.FmDriverId,
                    driverId: motorista.DriverId.toString(),
                    siteId: motorista.SiteId.toString(),
                    country: motorista.Country ? motorista.Country : "BR",
                    employeeNumber: Number.parseInt(motorista.EmployeeNumber, 10)
                        ? Number.parseInt(motorista.EmployeeNumber, 10)
                        : 0,
                    name: motorista.Name,
                    created_at: new Date(),
                });
            }
            else {
                await Driver_1.default.create({
                    fmDriverId: motorista.FmDriverId,
                    driverId: motorista.DriverId.toString(),
                    siteId: motorista.SiteId.toString(),
                    country: motorista.Country ? motorista.Country : "BR",
                    employeeNumber: Number.parseInt(motorista.EmployeeNumber, 10)
                        ? Number.parseInt(motorista.EmployeeNumber, 10)
                        : 0,
                    name: motorista.Name,
                });
            }
        }
        console.log("syncDrivers: Fim");
    }
    catch (error) {
        console.error(error);
    }
};
const syncAssets = async () => {
    try {
        const empresa = await (0, showEmpresa_1.default)({ id: 4 });
        const apiMix = api_mix_1.default.getInstance();
        await apiMix.getToken();
        const carros = await apiMix.listaCarros({
            groupId: empresa.mix_groupId,
        });
        for await (const carro of carros) {
            const asset = await Asset_1.default.findMixCode(carro.AssetId.toString());
            if (asset) {
                await Asset_1.default.update(asset.id, {
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
                    targetHourlyFuelConsumptionUnits: carro.TargetHourlyFuelConsumptionUnits,
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
                });
            }
            else {
                await Asset_1.default.create({
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
                    targetHourlyFuelConsumptionUnits: carro.TargetHourlyFuelConsumptionUnits,
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
                });
            }
        }
        console.log("syncAssets: Fim");
    }
    catch (error) {
        console.error(error);
    }
};
function dividirLista(lista, tamanho) {
    const resultado = [];
    for (let i = 0; i < lista.length; i += tamanho) {
        resultado.push(lista.slice(i, i + tamanho));
    }
    return resultado;
}
const insertPositions = async (positions) => {
    for (const position of positions) {
        try {
            const positionExists = await Position_1.default.findMixCode(position.PositionId.toString());
            if (!positionExists) {
                await Position_1.default.create({
                    positionId: position.PositionId.toString(),
                    driverId: position.DriverId.toString(),
                    assetId: position.AssetId.toString(),
                    lat: position.Latitude.toString(),
                    long: position.Longitude.toString(),
                    km: position.SpeedKilometresPerHour,
                    data: new Date(position.Timestamp),
                });
            }
        }
        catch (error) {
            console.error(error);
        }
    }
};
const syncPositionsByAsset = async () => {
    try {
        const empresa = await (0, showEmpresa_1.default)({ id: 4 });
        const apiMix = api_mix_1.default.getInstance();
        await apiMix.getToken();
        const carros = await Asset_1.default.getAll();
        const listaDividida = dividirLista(carros, 5);
        for await (const assets of listaDividida) {
            const tempAssets = assets.map((asset) => asset.assetId.toString());
            console.log(tempAssets);
            const positions = await apiMix.buscarPosicoesPorCarroData({
                assets: tempAssets,
                start,
                end,
            });
            await insertPositions(positions);
            // for await (const position of positions) {
            //   try {
            //     const positionExists = await Position.findMixCode(
            //       position.PositionId.toString(),
            //     )
            //     if (!positionExists) {
            //       await Position.create({
            //         positionId: position.PositionId.toString(),
            //         driverId: position.DriverId.toString(),
            //         assetId: position.AssetId.toString(),
            //         lat: position.Latitude.toString(),
            //         long: position.Longitude.toString(),
            //         km: position.SpeedKilometresPerHour,
            //         data: addHours(new Date(position.Timestamp), 3),
            //       })
            //     }
            //   } catch (error) {
            //     // se houver erro a posição existe
            //   }
            // }
        }
        console.log("syncPosicoesPorCarro: Fim");
    }
    catch (error) {
        console.error(error);
    }
};
const syncTrips = async () => {
    try {
        const empresa = await (0, showEmpresa_1.default)({ id: 4 });
        const apiMix = api_mix_1.default.getInstance();
        await apiMix.getToken();
        const carros = await Asset_1.default.getAll();
        // carros = carros.filter((carro) => carro.assetId === "1580750191846305792")
        const listaDividida = dividirLista(carros, 37);
        for await (const assets of listaDividida) {
            const tempAssets = assets.map((asset) => asset.assetId.toString());
            console.log(tempAssets);
            const trips = await apiMix.getTripsByAsset({
                assets: tempAssets,
                start,
                end,
            });
            for await (const trip of trips) {
                try {
                    const tripExists = await Trip_1.default.findMixCode(trip.TripId.toString());
                    if (tripExists) {
                        continue;
                    }
                    if (trip.StartPosition) {
                        const startPositionExists = await Position_1.default.findMixCode(trip.StartPosition.PositionId.toString());
                        if (!startPositionExists) {
                            await Position_1.default.create({
                                positionId: trip.StartPosition.PositionId.toString(),
                                driverId: trip.StartPosition.DriverId.toString(),
                                assetId: trip.StartPosition.AssetId.toString(),
                                lat: trip.StartPosition.Latitude.toString(),
                                long: trip.StartPosition.Longitude.toString(),
                                km: trip.StartPosition.SpeedKilometresPerHour,
                                data: new Date(trip.StartPosition.Timestamp),
                            });
                        }
                    }
                    if (trip.EndPosition) {
                        const endPositionExists = await Position_1.default.findMixCode(trip.EndPosition.PositionId.toString());
                        if (!endPositionExists) {
                            await Position_1.default.create({
                                positionId: trip.EndPosition.PositionId.toString(),
                                driverId: trip.EndPosition.DriverId.toString(),
                                assetId: trip.EndPosition.AssetId.toString(),
                                lat: trip.EndPosition.Latitude.toString(),
                                long: trip.EndPosition.Longitude.toString(),
                                km: trip.EndPosition.SpeedKilometresPerHour,
                                data: new Date(trip.EndPosition.Timestamp),
                            });
                        }
                    }
                    if (trip.SubTrips) {
                        for await (const subTrip of trip.SubTrips) {
                            try {
                                if (subTrip.StartPosition) {
                                    const positionExists = await Position_1.default.findMixCode(subTrip.StartPosition.PositionId.toString());
                                    if (!positionExists) {
                                        await Position_1.default.create({
                                            positionId: subTrip.StartPosition.PositionId.toString(),
                                            driverId: subTrip.StartPosition.DriverId.toString(),
                                            assetId: subTrip.StartPosition.AssetId.toString(),
                                            lat: subTrip.StartPosition.Latitude.toString(),
                                            long: subTrip.StartPosition.Longitude.toString(),
                                            km: subTrip.StartPosition.SpeedKilometresPerHour,
                                            data: new Date(subTrip.StartPosition.Timestamp),
                                        });
                                    }
                                }
                                if (subTrip.EndPosition) {
                                    const positionExists = await Position_1.default.findMixCode(subTrip.EndPosition.PositionId.toString());
                                    if (!positionExists) {
                                        await Position_1.default.create({
                                            positionId: subTrip.EndPosition.PositionId.toString(),
                                            driverId: subTrip.EndPosition.DriverId.toString(),
                                            assetId: subTrip.EndPosition.AssetId.toString(),
                                            lat: subTrip.EndPosition.Latitude.toString(),
                                            long: subTrip.EndPosition.Longitude.toString(),
                                            km: subTrip.EndPosition.SpeedKilometresPerHour,
                                            data: new Date(subTrip.EndPosition.Timestamp),
                                        });
                                    }
                                }
                            }
                            catch (error) {
                                console.error(error);
                            }
                        }
                    }
                    await Trip_1.default.create({
                        assetId: trip.AssetId.toString(),
                        driverId: trip.DriverId.toString(),
                        tripId: trip.TripId.toString(),
                        startPositionId: trip?.StartPositionId?.toString(),
                        endPositionId: trip?.EndPositionId?.toString(),
                        distanceKilometers: trip.DistanceKilometers,
                        duration: trip.Duration,
                        drivingTime: trip.DrivingTime,
                        maxRpm: trip.MaxRpm,
                        lastHalt: new Date(trip.LastHalt),
                        firstDepart: new Date(trip.FirstDepart),
                        endEngineSeconds: trip.EndEngineSeconds,
                        endOdometerKilometers: trip.EndOdometerKilometers,
                        engineSeconds: trip.EngineSeconds,
                        fuelUsedLitres: trip.FuelUsedLitres,
                        maxAccelerationKilometersPerHourPerSecond: trip.MaxAccelerationKilometersPerHourPerSecond,
                        maxDecelerationKilometersPerHourPerSecond: trip.MaxDecelerationKilometersPerHourPerSecond,
                        maxSpeedKilometersPerHour: trip.MaxSpeedKilometersPerHour,
                        standingTime: trip.StandingTime,
                        startEngineSeconds: trip.StartEngineSeconds,
                        startOdometerKilometers: trip.StartOdometerKilometers,
                        tripEnd: new Date(trip.TripEnd),
                        tripStart: new Date(trip.TripStart),
                    });
                }
                catch (error) {
                    console.log(trip);
                    console.error(error);
                }
            }
        }
        console.log("syncTrips: Fim");
    }
    catch (error) {
        console.error(error);
    }
};
const eventTypes = async () => {
    try {
        const idEmpresa = 4;
        const empresa = await (0, showEmpresa_1.default)({ id: idEmpresa });
        const apiMix = api_mix_1.default.getInstance();
        await apiMix.getToken();
        const eventTypes = await apiMix.getEventTypes({
            orgId: empresa.mix_groupId,
        });
        for await (const eventType of eventTypes) {
            const et = await EventTypes_1.default.findMixCode(eventType.EventTypeId.toString());
            if (et) {
                await EventTypes_1.default.update(et.id, {
                    eventTypeId: eventType.EventTypeId.toString(),
                    valueName: eventType.ValueName,
                    formatType: eventType.FormatType,
                    displayUnits: eventType.DisplayUnits,
                    eventType: eventType.EventType,
                    description: eventType.Description,
                    id_empresa: idEmpresa,
                    created_at: new Date(),
                });
            }
            else {
                await EventTypes_1.default.create({
                    eventTypeId: eventType.EventTypeId.toString(),
                    valueName: eventType.ValueName,
                    formatType: eventType.FormatType,
                    displayUnits: eventType.DisplayUnits,
                    eventType: eventType.EventType,
                    description: eventType.Description,
                    id_empresa: idEmpresa,
                });
            }
        }
        console.log("eventTypes: Fim");
    }
    catch (error) {
        console.error(error);
    }
};
const insertEvents = async (events) => {
    const drivers = await Driver_1.default.getAll();
    const driversIds = drivers.map((driver) => driver.driverId.toString());
    for (const event of events) {
        try {
            const eventExists = await Event_1.default.findMixCode(event.EventId.toString());
            if (event.StartPosition) {
                const positionExists = await Position_1.default.findMixCode(event.StartPosition.PositionId.toString());
                if (!positionExists &&
                    driversIds.includes(event.StartPosition.DriverId.toString())) {
                    await Position_1.default.create({
                        positionId: event.StartPosition.PositionId.toString(),
                        driverId: event.StartPosition.DriverId.toString(),
                        assetId: event.StartPosition.AssetId.toString(),
                        lat: event.StartPosition.Latitude.toString(),
                        long: event.StartPosition.Longitude.toString(),
                        km: event.StartPosition.SpeedKilometresPerHour,
                        data: new Date(event.StartPosition.Timestamp),
                    });
                }
            }
            if (event.EndPosition) {
                const positionExists = await Position_1.default.findMixCode(event.EndPosition.PositionId.toString());
                if (!positionExists &&
                    driversIds.includes(event.EndPosition.DriverId.toString())) {
                    await Position_1.default.create({
                        positionId: event.EndPosition.PositionId.toString(),
                        driverId: event.EndPosition.DriverId.toString(),
                        assetId: event.EndPosition.AssetId.toString(),
                        lat: event.EndPosition.Latitude.toString(),
                        long: event.EndPosition.Longitude.toString(),
                        km: event.EndPosition.SpeedKilometresPerHour,
                        data: new Date(event.EndPosition.Timestamp),
                    });
                }
            }
            if (!eventExists && driversIds.includes(event.DriverId.toString())) {
                await Event_1.default.create({
                    eventTypeId: event.EventTypeId.toString(),
                    eventId: event.EventId.toString(),
                    driverId: event.DriverId.toString(),
                    assetId: event.AssetId.toString(),
                    startPosition: event?.StartPosition?.PositionId?.toString() ?? undefined,
                    endPosition: event?.EndPosition?.PositionId?.toString() ?? undefined,
                    totalOccurances: event?.TotalOccurances,
                    totalTimeSeconds: event?.TotalTimeSeconds,
                    startDateTime: event.StartDateTime
                        ? new Date(event.StartDateTime)
                        : undefined,
                    endDateTime: event.EndDateTime
                        ? new Date(event.EndDateTime)
                        : undefined,
                    eventCategory: event?.EventCategory,
                    value: event?.Value?.toString(),
                    startOdometerKilometres: event?.StartOdometerKilometres,
                    endOdometerKilometres: event?.EndOdometerKilometres,
                    fuelUsedLitres: event?.FuelUsedLitres,
                });
            }
        }
        catch (error) {
            console.log(JSON.stringify(event, null, 2));
            console.error(error.sqlMessage);
            console.error(error.sql);
        }
    }
};
const syncEvents = async () => {
    try {
        const idEmpresa = 4;
        const empresa = await (0, showEmpresa_1.default)({ id: idEmpresa });
        const apiMix = api_mix_1.default.getInstance();
        await apiMix.getToken();
        const carros = await Asset_1.default.getAll();
        const listaDividida = dividirLista(carros, 5);
        const drivers = await Driver_1.default.getAll();
        const driversIds = drivers.map((driver) => driver.driverId.toString());
        const listaEventTypesCarregar = await EventTypes_1.default.getAllActiveItensCarregar({
            id_empresa: idEmpresa,
        });
        for await (const assets of listaDividida) {
            const tempAssets = assets.map((asset) => asset.assetId.toString());
            const tempEventTypes = listaEventTypesCarregar.map((et) => et.eventTypeId);
            const events = await apiMix.getEventByAssets({
                assets: tempAssets,
                tempEventTypes,
                start,
                end,
            });
            await insertEvents(events);
        }
        console.log("syncEvents: Fim");
    }
    catch (error) {
        console.error(error);
    }
};
const sync = async () => {
    // await syncDrivers()
    // await syncAssets()
    // await syncTrips()
    // await eventTypes()
    // await syncPositionsByAsset()
    await syncEvents();
    process.exit(0);
};
sync();
// syncDrivers()
// syncAssets()
// eventTypes()
// syncTrips()
// syncPositionsByAsset()
// syncEvents()
