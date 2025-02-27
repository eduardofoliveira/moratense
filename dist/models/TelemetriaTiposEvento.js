"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class TelemetriaTiposEvento {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return await db(TelemetriaTiposEvento.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return await db(TelemetriaTiposEvento.tableName).where({ id }).first();
    }
    static async getByIdEmpresa({ id_empresa, }) {
        const db = connectionManager_1.default.getConnection();
        return await db(TelemetriaTiposEvento.tableName)
            .select("*")
            .where({ id_empresa });
    }
    static async create(evento) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(TelemetriaTiposEvento.tableName).insert(evento);
        return id;
    }
    static async update(id, evento) {
        const db = connectionManager_1.default.getConnection();
        await db(TelemetriaTiposEvento.tableName).where({ id }).update(evento);
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(TelemetriaTiposEvento.tableName).where({ id }).delete();
    }
}
TelemetriaTiposEvento.tableName = "telemetria_tipos_eventos";
exports.default = TelemetriaTiposEvento;
