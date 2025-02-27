"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManagerHomeLab_1 = __importDefault(require("../database/connectionManagerHomeLab"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class GlobusCarro {
    static async getAll() {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusCarro.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusCarro.tableName).where({ id }).first();
    }
    static async findByChapa(chapa) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusCarro.tableName).where({ chapa }).first();
    }
    static async findByCodigo(codigo) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusCarro.tableName).where({ codigo }).first();
    }
    static async findByCodigoNumero(codigo_funcionario) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusCarro.tableName).where({ codigo_funcionario }).first();
    }
    static async create(funcionario) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [id] = await db(GlobusCarro.tableName).insert(funcionario);
        return id;
    }
    static async update(id, funcionario) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(GlobusCarro.tableName).where({ id }).update(funcionario);
    }
    static async delete(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(GlobusCarro.tableName).where({ id }).delete();
    }
}
GlobusCarro.tableName = "globus_funcionario";
exports.default = GlobusCarro;
