"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const dataRoutes_1 = __importDefault(require("./routes/dataRoutes"));
const response_error_1 = __importDefault(require("./middleware/response-error"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json({ limit: "200mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "200mb" }));
app.use(dataRoutes_1.default);
app.use(reportRoutes_1.default);
app.use(response_error_1.default);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
