"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManager_1 = __importDefault(require("../database/connectionManager"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Empresa {
    static async getAll() {
        const db = connectionManager_1.default.getConnection();
        return db(Empresa.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManager_1.default.getConnection();
        return db(Empresa.tableName).where({ id }).first();
    }
    // public static async findByCode(codigo: string): Promise<IEmpresa> {
    //   const db = Db.getConnection()
    //   return db(Test.tableName).where({ codigo }).first()
    // }
    static async create(empresa) {
        const db = connectionManager_1.default.getConnection();
        const [id] = await db(Empresa.tableName).insert(empresa);
        return id;
    }
    static async update(id, empresa) {
        const db = connectionManager_1.default.getConnection();
        await db(Empresa.tableName).where({ id }).update(empresa);
    }
    static async delete(id) {
        const db = connectionManager_1.default.getConnection();
        await db(Empresa.tableName).where({ id }).delete();
    }
}
Empresa.tableName = "empresas";
exports.default = Empresa;
