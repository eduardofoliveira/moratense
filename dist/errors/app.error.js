"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
class AppError {
    constructor(message, statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) {
        this.message = message;
        this.statusCode = statusCode;
    }
}
exports.default = AppError;
