"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const showAuxPosition_1 = __importDefault(require("../use-cases/auxPosition/showAuxPosition"));
const showTelemetriaCarro_1 = __importDefault(require("../use-cases/telemetriaCarro/showTelemetriaCarro"));
const insertDrankTelViagemPonto_1 = __importDefault(require("../use-cases/drankTelViagensPonto/insertDrankTelViagemPonto"));
const insertAuxPosition_1 = __importDefault(require("../use-cases/auxPosition/insertAuxPosition"));
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
    const { posicoes } = req.body;
    const empresa = await (0, showEmpresa_1.default)({ id: 4 });
    let count = 0;
    for await (const posicao of posicoes) {
        try {
            console.log(`Pontos: ${count++}`);
            const carro = await (0, showTelemetriaCarro_1.default)({
                codigo_mix: posicao.AssetId.toString(),
            });
            const positionExistDB = await (0, showAuxPosition_1.default)({
                positionId: posicao.PositionId.toString(),
            });
            if (positionExistDB) {
                continue;
            }
            const insert = {
                id_empresa: empresa.id,
                carro: carro.carro,
                km: posicao.SpeedKilometresPerHour,
                long: posicao.Longitude.toString(),
                lat: posicao.Latitude.toString(),
                data: new Date(posicao.Timestamp),
                data_turno: converteDataParaTurno(posicao.Timestamp),
                data_cadastro: new Date(),
            };
            const id = await (0, insertDrankTelViagemPonto_1.default)(insert);
            await (0, insertAuxPosition_1.default)({
                asset_id: posicao.AssetId.toString(),
                driver_id: posicao.DriverId.toString(),
                id_drank_tel_viagens_pontos: id,
                position_id: posicao.PositionId.toString(),
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    return res.send({ message: "Dados inseridos com sucesso" });
};
exports.default = {
    batchInsert,
};
