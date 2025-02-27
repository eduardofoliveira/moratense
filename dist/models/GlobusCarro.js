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
    static async findByPrefixo(prefixo) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusCarro.tableName).where({ prefixo }).first();
    }
    static async findByCodigoVeiculo(codigo_veiculo) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusCarro.tableName).where({ codigo_veiculo }).first();
    }
    static async findMixCode(assetId) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusCarro.tableName).where({ assetId }).first();
    }
    static async create(carro) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [id] = await db(GlobusCarro.tableName).insert(carro);
        return id;
    }
    static async update(id, carro) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(GlobusCarro.tableName).where({ id }).update(carro);
    }
    static async delete(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(GlobusCarro.tableName).where({ id }).delete();
    }
}
GlobusCarro.tableName = "globus_carro";
exports.default = GlobusCarro;
