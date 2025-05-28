import { Router } from "express"

const router = Router()

import assetController from "../controller/assetController"

router.get("/asset/listar", assetController.listarVeiculos)

export default router
