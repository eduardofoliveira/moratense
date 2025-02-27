"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TelemetriaCarro_1 = __importDefault(require("../../models/TelemetriaCarro"));
const execute = async ({ input, idEmpresa, }) => {
    console.log("Iniciando sincronização de carros...");
    for (const asset of input) {
        const exists = await TelemetriaCarro_1.default.findByMixCode(asset.AssetId);
        if (!exists) {
            const carro = Number.parseInt(asset.Description, 10);
            if (Number.isInteger(carro)) {
                await TelemetriaCarro_1.default.create({
                    carro: Number.parseInt(asset.Description, 10),
                    codigo_mix: asset.AssetId.toString(),
                    id_empresa: idEmpresa,
                    data_cadastro: new Date(),
                });
            }
        }
    }
    console.log("Finalizado sincronização de carros...");
};
exports.default = execute;
