"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class DrankTelConfig {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return db(DrankTelConfig.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return db(DrankTelConfig.tableName).where({ id }).first();
    }
    static async findByName(nome) {
        const db = connectionManager_1.default.getConnection();
        return db(DrankTelConfig.tableName).where({ nome }).first();
    }
    static async create(carro) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(DrankTelConfig.tableName).insert(carro);
        return id;
    }
    static async updateValueByName({ name, value, }) {
        const db = connectionManager_1.default.getConnection();
        await db(DrankTelConfig.tableName)
            .where({ nome: name })
            .update({ valor: value, data_update: db.fn.now() });
    }
    static async update(id, carro) {
        const db = connectionManager_1.default.getConnection();
        await db(DrankTelConfig.tableName)
            .where({ id })
            .update({ ...carro, data_update: db.fn.now() });
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(DrankTelConfig.tableName).where({ id }).delete();
    }
}
DrankTelConfig.tableName = "drank_tel_config";
exports.default = DrankTelConfig;
