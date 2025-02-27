"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
class ValidationError {
    constructor(error, statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST) {
        const errorMessages = error.errors.map((issue) => ({
            message: `${issue.message}`,
        }));
        this.error = "Erro de validação";
        this.statusCode = statusCode;
        this.details = errorMessages;
    }
}
exports.default = ValidationError;
