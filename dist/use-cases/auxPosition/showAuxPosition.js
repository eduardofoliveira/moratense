"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuxPosition_1 = __importDefault(require("../../models/AuxPosition"));
const execute = async ({ positionId }) => {
    return await AuxPosition_1.default.getByPositionId(positionId);
};
exports.default = execute;
