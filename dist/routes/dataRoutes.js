"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const viagensController_1 = __importDefault(require("../controller/viagensController"));
const eventosController_1 = __importDefault(require("../controller/eventosController"));
const pontosController_1 = __importDefault(require("../controller/pontosController"));
const router = (0, express_1.Router)();
router.post("/data/viagens", viagensController_1.default.batchInsert);
router.post("/data/eventos", eventosController_1.default.batchInsert);
router.post("/data/posicoes", pontosController_1.default.batchInsert);
exports.default = router;
