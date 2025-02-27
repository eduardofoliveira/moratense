"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TelemetriaCarro_1 = __importDefault(require("../../models/TelemetriaCarro"));
const execute = async ({ codigo_mix }) => {
    return await TelemetriaCarro_1.default.findByMixCode(codigo_mix);
};
exports.default = execute;
