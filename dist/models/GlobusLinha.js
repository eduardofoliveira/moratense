"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManagerHomeLab_1 = __importDefault(require("../database/connectionManagerHomeLab"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class GlobusLinha {
    static async getAll() {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusLinha.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusLinha.tableName).where({ id }).first();
    }
    static async findByCodigoAndFilial(codigo_linha, codigo_filial) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusLinha.tableName)
            .where({ codigo_linha, codigo_filial })
            .first();
    }
    static async create(linha) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [id] = await db(GlobusLinha.tableName).insert(linha);
        return id;
    }
    static async update(id, linha) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(GlobusLinha.tableName).where({ id }).update(linha);
    }
    static async delete(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(GlobusLinha.tableName).where({ id }).delete();
    }
}
GlobusLinha.tableName = "globus_linha";
exports.default = GlobusLinha;
