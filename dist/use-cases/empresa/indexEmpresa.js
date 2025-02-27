"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Empresa_1 = __importDefault(require("../../models/Empresa"));
const execute = async () => {
    return await Empresa_1.default.getAll();
};
exports.default = execute;
