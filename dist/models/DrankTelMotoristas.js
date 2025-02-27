"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class DrankTelMotoristas {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return db(DrankTelMotoristas.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return db(DrankTelMotoristas.tableName).where({ id }).first();
    }
    static async updateByMixCode({ codigo_mix, ...rest }) {
        const db = connectionManager_1.default.getConnection();
        await db(DrankTelMotoristas.tableName)
            .where({ codigo: codigo_mix })
            .update(rest);
    }
    static async findByMixCode(codigo_mix) {
        const db = connectionManager_1.default.getConnection();
        return db(DrankTelMotoristas.tableName)
            .where({ codigo: codigo_mix })
            .first();
    }
    static async create(motorista) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(DrankTelMotoristas.tableName).insert(motorista);
        return id;
    }
    static async update(id, motorista) {
        const db = connectionManager_1.default.getConnection();
        await db(DrankTelMotoristas.tableName).where({ id }).update(motorista);
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(DrankTelMotoristas.tableName).where({ id }).delete();
    }
}
DrankTelMotoristas.tableName = "drank_tel_motoristas";
exports.default = DrankTelMotoristas;
