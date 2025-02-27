"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DrankTelViagensPontos_1 = __importDefault(require("../../models/DrankTelViagensPontos"));
const execute = async (viagem) => {
    return await DrankTelViagensPontos_1.default.create(viagem);
};
exports.default = execute;
