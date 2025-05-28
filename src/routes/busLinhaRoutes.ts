import { Router } from "express"

const router = Router()

import busLinhaController from "../controller/busLinhaController"

router.get("/linhas/listar", busLinhaController.listarLinhas)

export default router
