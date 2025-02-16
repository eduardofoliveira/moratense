import { StatusCodes } from "http-status-codes"

class AppError {
  public readonly message: string
  public readonly statusCode: number

  constructor(message: string, statusCode = StatusCodes.INTERNAL_SERVER_ERROR) {
    this.message = message
    this.statusCode = statusCode
  }
}

export default AppError
