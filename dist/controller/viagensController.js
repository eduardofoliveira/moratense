"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const showAuxViagem_1 = __importDefault(require("../use-cases/auxViagem/showAuxViagem"));
const showDrankTelMotorista_1 = __importDefault(require("../use-cases/drankTelMotorista/showDrankTelMotorista"));
const showTelemetriaCarro_1 = __importDefault(require("../use-cases/telemetriaCarro/showTelemetriaCarro"));
const insertDrankTelViagem_1 = __importDefault(require("../use-cases/drankTelViagem/insertDrankTelViagem"));
const insertAuxViagem_1 = __importDefault(require("../use-cases/auxViagem/insertAuxViagem"));
const batchInsert = async (req, res) => {
    const { viagens } = req.body;
    let count = 0;
    for (const viagem of viagens) {
        try {
            console.log(`Viagem: ${count++}`);
            const dbExists = await (0, showAuxViagem_1.default)({ tripId: viagem.TripId.toString() });
            if (dbExists) {
                continue;
            }
            if (viagem.SubTrips && viagem.SubTrips.length > 0) {
                for (const subTrip of viagem.SubTrips) {
                    if (subTrip.SubTripStart && subTrip.SubTripEnd) {
                        const carro = await (0, showTelemetriaCarro_1.default)({
                            codigo_mix: viagem.AssetId.toString(),
                        });
                        const motorista = await (0, showDrankTelMotorista_1.default)({
                            codigo_mix: viagem.DriverId.toString(),
                        });
                        const id = await (0, insertDrankTelViagem_1.default)({
                            carro: carro.carro,
                            id_empresa: 4,
                            id_carro_tel: carro.id,
                            motorista_cod: motorista
                                ? motorista.codigo_motorista
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
                        });
                        await (0, insertAuxViagem_1.default)({
                            asset_id: viagem.AssetId.toString(),
                            driver_id: viagem.DriverId.toString(),
                            id_drank_tel_viagens: id,
                            trip_id: viagem.TripId.toString(),
                        });
                    }
                }
            }
            else {
                const carro = await (0, showTelemetriaCarro_1.default)({
                    codigo_mix: viagem.AssetId,
                });
                const motorista = await (0, showDrankTelMotorista_1.default)({
                    codigo_mix: viagem.DriverId,
                });
                const id = await (0, insertDrankTelViagem_1.default)({
                    carro: carro.carro,
                    id_empresa: 4,
                    id_carro_tel: carro.id,
                    motorista_cod: motorista ? motorista.codigo_motorista : 0,
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
                });
                await (0, insertAuxViagem_1.default)({
                    asset_id: viagem.AssetId.toString(),
                    driver_id: viagem.DriverId.toString(),
                    id_drank_tel_viagens: id,
                    trip_id: viagem.TripId.toString(),
                });
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    return res.send({ message: "Dados inseridos com sucesso" });
};
exports.default = {
    batchInsert,
};
