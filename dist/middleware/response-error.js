"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = responseError;
const validation_error_1 = __importDefault(require("../errors/validation.error"));
const app_error_1 = __importDefault(require("../errors/app.error"));
function responseError(error, _request, response, _next) {
    if (error instanceof app_error_1.default) {
        return response.status(error.statusCode).json({
            error: error.message,
        });
    }
    if (error instanceof validation_error_1.default) {
        return response.status(error.statusCode).json({
            error: error.error,
            details: error.details,
        });
    }
    console.error(error);
    if (process.env.ENVIRONMENT === "development") {
        return response.status(500).json({
            error: "Internal server error",
            message: error.message,
            stack: error.stack,
        });
    }
    return response.status(500).json({
        error: "Internal server error",
    });
}
