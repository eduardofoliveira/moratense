import { Router } from "express"

const router = Router()

import chassiController from "../controller/chassiController"

router.get("/chassi/listar", chassiController.listarChassi)

export default router
