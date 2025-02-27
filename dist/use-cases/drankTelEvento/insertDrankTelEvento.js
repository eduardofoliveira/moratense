"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DrankTelEvento_1 = __importDefault(require("../../models/DrankTelEvento"));
const execute = async (evento) => {
    return await DrankTelEvento_1.default.create(evento);
};
exports.default = execute;
