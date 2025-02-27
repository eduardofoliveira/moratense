"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TelemetriaTiposEvento_1 = __importDefault(require("../../models/TelemetriaTiposEvento"));
const execute = async ({ id_empresa }) => {
    return await TelemetriaTiposEvento_1.default.getByIdEmpresa({ id_empresa });
};
exports.default = execute;
