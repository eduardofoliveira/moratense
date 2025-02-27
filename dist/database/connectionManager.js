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
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        database: process.env.MYSQL_DATABASE,
    },
};
config.development = {
    client: "mysql2",
    connection: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        database: process.env.MYSQL_DATABASE,
    },
};
const getConfig = () => {
    if (process.env.ENVIRONMENT === "production") {
        return config.production;
    }
    return config.development;
};
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class ConnectionManager {
    // Singleton para manter a conexão única
    static getConnection() {
        if (!ConnectionManager.instance) {
            ConnectionManager.createConnection();
        }
        return ConnectionManager.instance;
    }
    // Cria a conexão inicial ou recriada
    static createConnection() {
        ConnectionManager.instance = (0, knex_1.default)(getConfig());
        // Escutar erros na conexão
        ConnectionManager.instance.raw("SELECT 1").catch((err) => {
            console.error("Initial database connection failed:", err);
            ConnectionManager.attemptReconnect();
        });
        // Escuta erros para tentar reconectar
        ConnectionManager.instance.on("query-error", (err) => {
            console.error("Query error detected:", err);
            if (err.code === "ECONNRESET" ||
                err.code === "PROTOCOL_CONNECTION_LOST") {
                if (!ConnectionManager.reconnecting) {
                    ConnectionManager.attemptReconnect();
                }
            }
        });
    }
    // Recriar conexão no caso de erro crítico
    static attemptReconnect() {
        if (ConnectionManager.reconnecting ||
            ConnectionManager.reconnectAttempts >=
                ConnectionManager.maxReconnectAttempts) {
            console.error("Max reconnect attempts reached or already reconnecting.");
            return;
        }
        ConnectionManager.reconnecting = true;
        ConnectionManager.reconnectAttempts++;
        setTimeout(() => {
            console.warn(`Attempting to reconnect... (${ConnectionManager.reconnectAttempts}/${ConnectionManager.maxReconnectAttempts})`);
            try {
                ConnectionManager.createConnection();
                ConnectionManager.reconnecting = false;
                ConnectionManager.reconnectAttempts = 0;
                console.log("Reconnected to the database successfully.");
            }
            catch (err) {
                console.error("Reconnection attempt failed:", err);
                ConnectionManager.reconnecting = false;
                if (ConnectionManager.reconnectAttempts <
                    ConnectionManager.maxReconnectAttempts) {
                    ConnectionManager.attemptReconnect();
                }
            }
        }, ConnectionManager.reconnectInterval);
    }
}
ConnectionManager.reconnecting = false;
ConnectionManager.reconnectAttempts = 0;
ConnectionManager.maxReconnectAttempts = 5;
ConnectionManager.reconnectInterval = 5000; // 5 segundos
exports.default = ConnectionManager;
