import type { Request, Response } from "express"

import login from "../use-cases/auth/login"
import { loginReturnDTO } from "../dto/auth/authDTO"

const auth = async (req: Request, res: Response): Promise<any> => {
  const { user, password } = req.body

  const result = await login({ user, password })

  if (!result) {
    return res.status(401).json({ error: "Usuário ou senha inválidos" })
  }

  return res.json(loginReturnDTO(result))
}

export default {
  auth,
}
