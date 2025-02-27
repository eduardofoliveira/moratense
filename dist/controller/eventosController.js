"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const showAuxEvento_1 = __importDefault(require("../use-cases/auxEvento/showAuxEvento"));
const showTelemetriaCarro_1 = __importDefault(require("../use-cases/telemetriaCarro/showTelemetriaCarro"));
const showDrankTelMotorista_1 = __importDefault(require("../use-cases/drankTelMotorista/showDrankTelMotorista"));
const insertDrankTelEvento_1 = __importDefault(require("../use-cases/drankTelEvento/insertDrankTelEvento"));
const insertAuxEvento_1 = __importDefault(require("../use-cases/auxEvento/insertAuxEvento"));
const showTelemetriaTiposEventoConverter_1 = __importDefault(require("../use-cases/telemetriaTipoEventoConverter/showTelemetriaTiposEventoConverter"));
const showTelemetriaTiposEvento_1 = __importDefault(require("../use-cases/telemetriaTiposEvento/showTelemetriaTiposEvento"));
const showEmpresa_1 = __importDefault(require("../use-cases/empresa/showEmpresa"));
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
const batchInsert = async (req, res) => {
    const { eventos } = req.body;
    const empresa = await (0, showEmpresa_1.default)({ id: 4 });
    const eventosDb = await (0, showTelemetriaTiposEvento_1.default)({
        id_empresa: 4,
    });
    const eventosConverter = await (0, showTelemetriaTiposEventoConverter_1.default)({
        id_empresa: 4,
    });
    let count = 0;
    for (const evento of eventos) {
        try {
            console.log(`Eventos: ${count++}`);
            const eventoExistDB = await (0, showAuxEvento_1.default)({
                tripId: evento.EventId.toString(),
            });
            if (eventoExistDB) {
                continue;
            }
            const carro = await (0, showTelemetriaCarro_1.default)({
                codigo_mix: evento.AssetId.toString(),
            });
            const motorista = await (0, showDrankTelMotorista_1.default)({
                codigo_mix: evento.DriverId.toString(),
            });
            const idTipoConverter = eventosConverter.find((item) => item.id_mix_entrada === evento.EventTypeId.toString());
            const findEventoDB = eventosDb.find((item) => item.codigo === evento.EventTypeId.toString());
            let long = "";
            let lat = "";
            if (evento.StartPosition) {
                long = evento?.StartPosition?.Longitude.toString();
                lat = evento?.StartPosition?.Latitude.toString();
            }
            let id_tipo = 0;
            if (idTipoConverter) {
                id_tipo = idTipoConverter.id_tipo_saida;
            }
            if (id_tipo === 0 && findEventoDB && findEventoDB.id_tipo_original) {
                id_tipo = findEventoDB.id_tipo_original;
            }
            if (id_tipo === 0 && findEventoDB) {
                id_tipo = findEventoDB.id;
            }
            const insert = {
                id_empresa: empresa.id,
                carro: carro.carro,
                id_carro_tel: carro.id,
                id_motorista: motorista ? motorista.codigo_motorista : 0,
                data_ini: evento.StartDateTime
                    ? new Date(evento.StartDateTime)
                    : "0000-00-00 00:00:00",
                data_fim: evento.TotalTimeSeconds > 0
                    ? new Date(evento.EndDateTime)
                    : "0000-00-00 00:00:00",
                id_tipo,
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
        catch (error) {
            console.error(error);
        }
    }
    return res.send({ message: "Dados inseridos com sucesso" });
};
exports.default = {
    batchInsert,
};
