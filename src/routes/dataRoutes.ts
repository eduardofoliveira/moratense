import { Router } from "express"

import viagensController from "../controller/viagensController"
import eventosController from "../controller/eventosController"
import pontosController from "../controller/pontosController"

const router = Router()

router.post("/data/viagens", viagensController.batchInsert)
router.post("/data/eventos", eventosController.batchInsert)
router.post("/data/posicoes", pontosController.batchInsert)

export default router
