import { StatusCodes } from "http-status-codes"
import { ZodError } from "zod"

class ValidationError {
  public readonly error: string

  public readonly statusCode: number
  public readonly details: object

  constructor(error: ZodError, statusCode = StatusCodes.BAD_REQUEST) {
    const errorMessages = error.errors.map((issue: any) => ({
      message: `${issue.message}`,
    }))

    this.error = "Erro de validação"
    this.statusCode = statusCode
    this.details = errorMessages
  }
}

export default ValidationError
