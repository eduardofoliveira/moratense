"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TelemetriaMotorista_1 = __importDefault(require("../../models/TelemetriaMotorista"));
const execute = async (id, id_empresa, motorista) => {
    return await TelemetriaMotorista_1.default.update(id, id_empresa, motorista);
};
exports.default = execute;
