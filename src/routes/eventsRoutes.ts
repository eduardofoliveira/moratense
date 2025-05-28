import { Router } from "express"

const router = Router()

import eventsController from "../controller/eventsController"

router.get("/events/consumer", eventsController.listarEventosConsumo)
router.get("/events/security", eventsController.listarEventosSeguranca)

export default router
