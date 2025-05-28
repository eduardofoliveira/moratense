import { Router } from "express"

const router = Router()

import driverController from "../controller/driverController"

router.get("/driver/listar", driverController.listarMotoristas)

export default router
