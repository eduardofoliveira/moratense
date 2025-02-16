import { Request, Response, NextFunction } from "express"

const tokensDev = ["c498967a50d7b2587229403cd4ac58cf"]

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response<any, Record<string, any>> | any => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      throw new Error()
    }

    if (!tokensDev.includes(token)) {
      return res.status(401).json({ error: "Invalid Token" })
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: "Please authenticate" })
  }
}
