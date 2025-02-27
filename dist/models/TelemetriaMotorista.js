"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class TelemetriaMotorista {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return await db(TelemetriaMotorista.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return await db(TelemetriaMotorista.tableName).where({ id }).first();
    }
    static async getByCodigoMix(codigo) {
        const db = connectionManager_1.default.getConnection();
        return await db(TelemetriaMotorista.tableName).where({ codigo }).first();
    }
    static async getByCodigoMotorista(codigo_motorista) {
        const db = connectionManager_1.default.getConnection();
        return await db(TelemetriaMotorista.tableName)
            .where({ codigo_motorista })
            .first();
    }
    static async getByIdEmpresa({ id_empresa, }) {
        const db = connectionManager_1.default.getConnection();
        return await db(TelemetriaMotorista.tableName)
            .select("*")
            .where({ id_empresa });
    }
    static async create(motorista) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(TelemetriaMotorista.tableName).insert(motorista);
        return id;
    }
    static async update(codigo, id_empresa, motorista) {
        const db = connectionManager_1.default.getConnection();
        await db(TelemetriaMotorista.tableName)
            .where({ codigo, id_empresa })
            .update(motorista);
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(TelemetriaMotorista.tableName).where({ id }).delete();
    }
}
TelemetriaMotorista.tableName = "telemetria_motoristas";
exports.default = TelemetriaMotorista;
