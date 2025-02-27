"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DrankTelConfig_1 = __importDefault(require("../../models/DrankTelConfig"));
const execute = async ({ name }) => {
    return await DrankTelConfig_1.default.findByName(name);
};
exports.default = execute;
