"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class AuxEventos {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return db(AuxEventos.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return db(AuxEventos.tableName).where({ id }).first();
    }
    static async getByEventId(eventId) {
        const db = connectionManager_1.default.getConnection();
        return db(AuxEventos.tableName).where({ event_id: eventId }).first();
    }
    static async create(viagem) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(AuxEventos.tableName).insert(viagem);
        return id;
    }
    static async update(id, viagem) {
        const db = connectionManager_1.default.getConnection();
        await db(AuxEventos.tableName).where({ id }).update(viagem);
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(AuxEventos.tableName).where({ id }).delete();
    }
}
AuxEventos.tableName = "aux_eventos";
exports.default = AuxEventos;
