"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class TelemetriaTiposEventoConverter {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return db(TelemetriaTiposEventoConverter.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return db(TelemetriaTiposEventoConverter.tableName).where({ id }).first();
    }
    static async getByIdEmpresa({ id_empresa, }) {
        const db = connectionManager_1.default.getConnection();
        return await db(TelemetriaTiposEventoConverter.tableName)
            .select("*")
            .where({ id_empresa });
    }
    static async create(evento) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(TelemetriaTiposEventoConverter.tableName).insert(evento);
        return id;
    }
    static async update(id, evento) {
        const db = connectionManager_1.default.getConnection();
        await db(TelemetriaTiposEventoConverter.tableName)
            .where({ id })
            .update(evento);
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(TelemetriaTiposEventoConverter.tableName).where({ id }).delete();
    }
}
TelemetriaTiposEventoConverter.tableName = "telemetria_tipos_eventos_converter";
exports.default = TelemetriaTiposEventoConverter;
