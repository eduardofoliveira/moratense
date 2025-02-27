"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuxViagens_1 = __importDefault(require("../../models/AuxViagens"));
const execute = async ({ tripId }) => {
    return await AuxViagens_1.default.getByTripId(tripId);
};
exports.default = execute;
