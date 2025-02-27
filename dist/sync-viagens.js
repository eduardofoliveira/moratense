"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const date_fns_1 = require("date-fns");
const api_mix_1 = __importDefault(require("./service/api.mix"));
const showEmpresa_1 = __importDefault(require("./use-cases/empresa/showEmpresa"));
const showDrankTelConfig_1 = __importDefault(require("./use-cases/drankTelConfig/showDrankTelConfig"));
const updateDrankTelConfig_1 = __importDefault(require("./use-cases/drankTelConfig/updateDrankTelConfig"));
const insertDrankTelViagem_1 = __importDefault(require("./use-cases/drankTelViagem/insertDrankTelViagem"));
const showTelemetriaCarro_1 = __importDefault(require("./use-cases/telemetriaCarro/showTelemetriaCarro"));
const showDrankTelMotorista_1 = __importDefault(require("./use-cases/drankTelMotorista/showDrankTelMotorista"));
const insertAuxViagem_1 = __importDefault(require("./use-cases/auxViagem/insertAuxViagem"));
const insertAuxEvento_1 = __importDefault(require("./use-cases/auxEvento/insertAuxEvento"));
const showTelemetriaTiposEvento_1 = __importDefault(require("./use-cases/telemetriaTiposEvento/showTelemetriaTiposEvento"));
const showTelemetriaTiposEventoConverter_1 = __importDefault(require("./use-cases/telemetriaTipoEventoConverter/showTelemetriaTiposEventoConverter"));
const insertDrankTelEvento_1 = __importDefault(require("./use-cases/drankTelEvento/insertDrankTelEvento"));
const showAuxViagem_1 = __importDefault(require("./use-cases/auxViagem/showAuxViagem"));
function converteDataParaTurno(data) {
    const dataObj = new Date(data);
    let dt = (0, date_fns_1.format)(dataObj, "yyyy-MM-dd");
    const hora = dataObj.getHours();
    const minutos = dataObj.getMinutes();
    const segundos = dataObj.getSeconds();
    if (hora < 2 && minutos < 59 && segundos < 59) {
        dt = (0, date_fns_1.format)((0, date_fns_1.subDays)((0, date_fns_1.parseISO)(dt), 1), "yyyy-MM-dd");
    }
    return dt;
}
const sincronizarViagens = async ({ token }) => {
    const empresa = await (0, showEmpresa_1.default)({ id: 4 });
    const apiMix = api_mix_1.default.getInstance();
    await apiMix.getToken();
    const { getsincetoken, viagens } = await apiMix.carregaViagens({
        orgId: BigInt(empresa.mix_groupId),
        token, // 999
    });
    await (0, updateDrankTelConfig_1.default)({
        name: "sinceTokenTrips",
        value: getsincetoken,
    });
    if (viagens.length === 0) {
        return;
    }
    console.log(`Token: ${getsincetoken}`);
    console.log(`Viagens: ${viagens.length}`);
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
    await sincronizarViagens({ token: getsincetoken });
};
const sincronizarEventos = async ({ token }) => {
    const empresa = await (0, showEmpresa_1.default)({ id: 4 });
    const eventosDb = await (0, showTelemetriaTiposEvento_1.default)({
        id_empresa: 4,
    });
    const eventosConverter = await (0, showTelemetriaTiposEventoConverter_1.default)({
        id_empresa: 4,
    });
    const codigosEventos = [];
    for (const evento of eventosDb) {
        if (evento.rank_seguranca === 1 &&
            evento.rank_consulmo === 1 &&
            evento.carregar === 1) {
            codigosEventos.push(evento.codigo);
        }
    }
    const apiMix = api_mix_1.default.getInstance();
    await apiMix.getToken();
    const response = await apiMix.listaEventosCarroPorDataST({
        groupId: empresa.mix_groupId,
        codigosEventos,
        token,
    });
    const eventos = response.eventos;
    // const hasmoreitems = response.hasmoreitems
    const getsincetoken = response.getsincetoken;
    console.log(`Token: ${getsincetoken}`);
    console.log(`Eventos: ${eventos.length}`);
    let count = 0;
    await (0, updateDrankTelConfig_1.default)({
        name: "sinceTokenEvents",
        value: getsincetoken,
    });
    if (eventos.length === 0) {
        return;
    }
    for (const evento of eventos) {
        console.log(`Viagem: ${count++}`);
        const carro = await (0, showTelemetriaCarro_1.default)({
            codigo_mix: evento.AssetId.toString(),
        });
        const motorista = await (0, showDrankTelMotorista_1.default)({
            codigo_mix: evento.DriverId.toString(),
        });
        const id_tipo = eventosConverter.find((item) => item.id_mix_entrada === evento.EventTypeId.toString());
        let long = "";
        let lat = "";
        if (evento.StartPosition) {
            long = evento?.StartPosition?.Longitude.toString();
            lat = evento?.StartPosition?.Latitude.toString();
        }
        const insert = {
            id_empresa: empresa.id,
            carro: carro.carro,
            id_carro_tel: carro.id,
            id_motorista: motorista ? motorista.id : 0,
            data_ini: evento.StartDateTime
                ? new Date(evento.StartDateTime)
                : "0000-00-00 00:00:00",
            data_fim: evento.TotalTimeSeconds > 0
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
        };
        const id = await (0, insertDrankTelEvento_1.default)(insert);
        await (0, insertAuxEvento_1.default)({
            asset_id: evento.AssetId.toString(),
            driver_id: evento.DriverId.toString(),
            event_id: evento.EventId.toString(),
            event_type_id: evento.EventTypeId.toString(),
            id_drank_tel_eventos: id,
        });
    }
    await sincronizarEventos({ token: getsincetoken });
};
const executar = async () => {
    try {
        const config = await (0, showDrankTelConfig_1.default)({ name: "sinceTokenTrips" });
        await sincronizarViagens({ token: Number.parseInt(config.valor) });
        console.log("viagens inseridas");
    }
    catch (error) {
        console.error(error);
    }
    setTimeout(async () => {
        executar();
    }, 60000);
};
executar();
