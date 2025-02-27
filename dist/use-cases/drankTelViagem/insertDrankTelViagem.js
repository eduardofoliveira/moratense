"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DrankTelViagens_1 = __importDefault(require("../../models/DrankTelViagens"));
const execute = async (viagem) => {
    return await DrankTelViagens_1.default.create(viagem);
};
exports.default = execute;
