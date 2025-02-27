"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DrankTelMotoristas_1 = __importDefault(require("../../models/DrankTelMotoristas"));
const execute = async (data) => {
    return await DrankTelMotoristas_1.default.create(data);
};
exports.default = execute;
