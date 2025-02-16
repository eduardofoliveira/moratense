import type { Request, Response, NextFunction } from "express"

import ValidationError from "../errors/validation.error"
import AppError from "../errors/app.error"

export default function responseError(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
): any {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      error: error.message,
    })
  }
  if (error instanceof ValidationError) {
    return response.status(error.statusCode).json({
      error: error.error,
      details: error.details,
    })
  }
  console.error(error)

  if (process.env.ENVIRONMENT === "development") {
    return response.status(500).json({
      error: "Internal server error",
      message: error.message,
      stack: error.stack,
    })
  }

  return response.status(500).json({
    error: "Internal server error",
  })
}
