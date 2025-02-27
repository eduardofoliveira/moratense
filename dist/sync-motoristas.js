"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const api_mix_1 = __importDefault(require("./service/api.mix"));
const showEmpresa_1 = __importDefault(require("./use-cases/empresa/showEmpresa"));
const indexTelemetriaMotorista_1 = __importDefault(require("./use-cases/telemetriaMotorista/indexTelemetriaMotorista"));
const insertTelemetriaMotorista_1 = __importDefault(require("./use-cases/telemetriaMotorista/insertTelemetriaMotorista"));
const updateTelemetriaMotorista_1 = __importDefault(require("./use-cases/telemetriaMotorista/updateTelemetriaMotorista"));
const updateDrankTelMotoristaByCodMix_1 = __importDefault(require("./use-cases/drankTelMotorista/updateDrankTelMotoristaByCodMix"));
const showDrankTelMotorista_1 = __importDefault(require("./use-cases/drankTelMotorista/showDrankTelMotorista"));
const insertDrankTelMotorista_1 = __importDefault(require("./use-cases/drankTelMotorista/insertDrankTelMotorista"));
let executando = false;
const executar = async () => {
    if (executando) {
        return;
    }
    executando = true;
    try {
        const empresa = await (0, showEmpresa_1.default)({ id: 4 });
        const apiMix = api_mix_1.default.getInstance();
        await apiMix.getToken();
        const motoristasDb = await (0, indexTelemetriaMotorista_1.default)();
        const motoristas = await apiMix.listaMotoristas({
            groupId: empresa.mix_groupId,
        });
        console.log(`Total: ${motoristas.length}`);
        let count = 0;
        for await (const motorista of motoristas) {
            console.log(`Motorista: ${count++}`);
            console.log(`Motorista: ${motorista.Name}`);
            const motoristaExistDrank = await (0, showDrankTelMotorista_1.default)({
                codigo_mix: motorista.DriverId.toString(),
            });
            if (!motoristaExistDrank) {
                console.log(`Inserindo Motorista ${motorista.Name} no Drank`);
                if (Number.parseInt(motorista.EmployeeNumber, 10) > 0) {
                    await (0, insertDrankTelMotorista_1.default)({
                        codigo: motorista.DriverId.toString(),
                        codigo_motorista: Number.parseInt(motorista.EmployeeNumber, 10),
                        data_cadastro: new Date(),
                        id_empresa: empresa.id,
                        nome: motorista.Name,
                    });
                }
            }
            if (motoristaExistDrank) {
                // console.log("Motorista existe no Drank")
                if (Number.parseInt(motorista.EmployeeNumber, 10) > 0) {
                    await (0, updateDrankTelMotoristaByCodMix_1.default)({
                        codigo_mix: motorista.DriverId.toString(),
                        codigo_motorista: Number.parseInt(motorista.EmployeeNumber, 10),
                        id_empresa: empresa.id,
                        nome: motorista.Name,
                    });
                }
            }
            const exists = motoristasDb.find((item) => BigInt(item.codigo) === BigInt(motorista.DriverId));
            if (!exists) {
                console.log(`Inserindo Motorista ${motorista.Name} no Telemetria`);
                if (Number.parseInt(motorista.EmployeeNumber, 10) > 0) {
                    await (0, insertTelemetriaMotorista_1.default)({
                        codigo: motorista.DriverId.toString(),
                        id_empresa: empresa.id,
                        codigo_motorista: Number.parseInt(motorista.EmployeeNumber, 10),
                        nome: motorista.Name,
                        data_cadastro: new Date(),
                    });
                }
            }
            if (exists) {
                if (Number.parseInt(motorista.EmployeeNumber, 10) > 0) {
                    (0, updateTelemetriaMotorista_1.default)(motorista.DriverId.toString(), empresa.id, {
                        codigo: motorista.DriverId.toString(),
                        codigo_motorista: Number.parseInt(motorista.EmployeeNumber, 10),
                        data_cadastro: new Date(),
                        id_empresa: empresa.id,
                        nome: motorista.Name,
                    });
                }
            }
        }
    }
    catch (error) {
        executando = false;
        console.log(error);
    }
    executando = false;
};
setInterval(() => {
    executar();
}, 60000);
executar();
