"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class DrankTelViagens {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return db(DrankTelViagens.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return db(DrankTelViagens.tableName).where({ id }).first();
    }
    static async create(viagem) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(DrankTelViagens.tableName).insert(viagem);
        return id;
    }
    static async update(id, viagem) {
        const db = connectionManager_1.default.getConnection();
        await db(DrankTelViagens.tableName).where({ id }).update(viagem);
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(DrankTelViagens.tableName).where({ id }).delete();
    }
}
DrankTelViagens.tableName = "drank_tel_viagens_pontos";
exports.default = DrankTelViagens;
