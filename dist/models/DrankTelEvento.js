"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class DrankTelEvento {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return db(DrankTelEvento.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return db(DrankTelEvento.tableName).where({ id }).first();
    }
    static async create(evento) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(DrankTelEvento.tableName).insert(evento);
        return id;
    }
    static async update(id, evento) {
        const db = connectionManager_1.default.getConnection();
        await db(DrankTelEvento.tableName).where({ id }).update(evento);
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(DrankTelEvento.tableName).where({ id }).delete();
    }
}
DrankTelEvento.tableName = "drank_tel_eventos";
exports.default = DrankTelEvento;
