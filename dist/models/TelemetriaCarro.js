"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class TelemetriaCarro {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return db(TelemetriaCarro.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return db(TelemetriaCarro.tableName).where({ id }).first();
    }
    static async findByMixCode(codigo) {
        const db = connectionManager_1.default.getConnection();
        return db(TelemetriaCarro.tableName).where({ codigo_mix: codigo }).first();
    }
    // public static async findByCode(codigo: string): Promise<IEmpresa> {
    //   const db = Db.getConnection()
    //   return db(Test.tableName).where({ codigo }).first()
    // }
    static async create(carro) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(TelemetriaCarro.tableName).insert(carro);
        return id;
    }
    static async update(id, carro) {
        const db = connectionManager_1.default.getConnection();
        await db(TelemetriaCarro.tableName).where({ id }).update(carro);
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(TelemetriaCarro.tableName).where({ id }).delete();
    }
}
TelemetriaCarro.tableName = "telemetria_carros";
exports.default = TelemetriaCarro;
