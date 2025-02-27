"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class AuxViagens {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return db(AuxViagens.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return db(AuxViagens.tableName).where({ id }).first();
    }
    static async getByTripId(tripId) {
        const db = connectionManager_1.default.getConnection();
        return db(AuxViagens.tableName).where({ trip_id: tripId }).first();
    }
    static async create(viagem) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(AuxViagens.tableName).insert(viagem);
        return id;
    }
    static async update(id, viagem) {
        const db = connectionManager_1.default.getConnection();
        await db(AuxViagens.tableName).where({ id }).update(viagem);
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(AuxViagens.tableName).where({ id }).delete();
    }
}
AuxViagens.tableName = "aux_viagens";
exports.default = AuxViagens;
