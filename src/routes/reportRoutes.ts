import { Router } from "express"

import rankingController from "../controller/rankingController"
import { authMiddleware } from "../middleware/authMiddleware"

const router = Router()

router.use(authMiddleware)
router.post("/report/ranking", rankingController.index)

export default router
