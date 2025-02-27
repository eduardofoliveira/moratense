"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("knex"));
const config = {
    production: {},
    development: {},
};
config.production = {
    client: "mysql2",
    connection: {
        host: process.env.MYSQL_HOST_HG,
        user: process.env.MYSQL_USER_HG,
        password: process.env.MYSQL_PASS_HG,
        database: process.env.MYSQL_DATABASE_HG,
    },
};
config.development = {
    client: "mysql2",
    connection: {
        host: process.env.MYSQL_HOST_HG,
        user: process.env.MYSQL_USER_HG,
        password: process.env.MYSQL_PASS_HG,
        database: process.env.MYSQL_DATABASE_HG,
    },
};
const getConfig = () => {
    if (process.env.ENVIRONMENT === "production") {
        return config.production;
    }
    return config.development;
};
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class connectionManagerHostgator {
    // Singleton para manter a conexão única
    static getConnection() {
        if (!connectionManagerHostgator.instance) {
            connectionManagerHostgator.createConnection();
        }
        return connectionManagerHostgator.instance;
    }
    // Cria a conexão inicial ou recriada
    static createConnection() {
        connectionManagerHostgator.instance = (0, knex_1.default)(getConfig());
        // Escutar erros na conexão
        connectionManagerHostgator.instance.raw("SELECT 1").catch((err) => {
            console.error("Initial database connection failed:", err);
            connectionManagerHostgator.attemptReconnect();
        });
        // Escuta erros para tentar reconectar
        connectionManagerHostgator.instance.on("query-error", (err) => {
            console.error("Query error detected:", err);
            if (err.code === "ECONNRESET" ||
                err.code === "PROTOCOL_CONNECTION_LOST") {
                if (!connectionManagerHostgator.reconnecting) {
                    connectionManagerHostgator.attemptReconnect();
                }
            }
        });
    }
    // Recriar conexão no caso de erro crítico
    static attemptReconnect() {
        if (connectionManagerHostgator.reconnecting ||
            connectionManagerHostgator.reconnectAttempts >=
                connectionManagerHostgator.maxReconnectAttempts) {
            console.error("Max reconnect attempts reached or already reconnecting.");
            return;
        }
        connectionManagerHostgator.reconnecting = true;
        connectionManagerHostgator.reconnectAttempts++;
        setTimeout(() => {
            console.warn(`Attempting to reconnect... (${connectionManagerHostgator.reconnectAttempts}/${connectionManagerHostgator.maxReconnectAttempts})`);
            try {
                connectionManagerHostgator.createConnection();
                connectionManagerHostgator.reconnecting = false;
                connectionManagerHostgator.reconnectAttempts = 0;
                console.log("Reconnected to the database successfully.");
            }
            catch (err) {
                console.error("Reconnection attempt failed:", err);
                connectionManagerHostgator.reconnecting = false;
                if (connectionManagerHostgator.reconnectAttempts <
                    connectionManagerHostgator.maxReconnectAttempts) {
                    connectionManagerHostgator.attemptReconnect();
                }
            }
        }, connectionManagerHostgator.reconnectInterval);
    }
}
connectionManagerHostgator.reconnecting = false;
connectionManagerHostgator.reconnectAttempts = 0;
connectionManagerHostgator.maxReconnectAttempts = 5;
connectionManagerHostgator.reconnectInterval = 5000; // 5 segundos
exports.default = connectionManagerHostgator;
