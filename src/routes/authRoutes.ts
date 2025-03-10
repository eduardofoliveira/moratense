import { Router } from "express"

import { validateData } from "../middleware/validationMiddleware"
import { loginSchema } from "../schemas/authSchemas"
import authController from "../controller/authController"

const router = Router()

router.post("/auth", validateData(loginSchema), authController.auth)

export default router
