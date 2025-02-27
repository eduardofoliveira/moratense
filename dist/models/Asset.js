"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManagerHomeLab_1 = __importDefault(require("../database/connectionManagerHomeLab"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Driver {
    static async getAll() {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Driver.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Driver.tableName).where({ id }).first();
    }
    static async findMixCode(assetId) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Driver.tableName).where({ assetId }).first();
    }
    static async create(asset) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [id] = await db(Driver.tableName).insert(asset);
        return id;
    }
    static async update(id, asset) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(Driver.tableName).where({ id }).update(asset);
    }
    static async delete(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(Driver.tableName).where({ id }).delete();
    }
}
Driver.tableName = "assets";
exports.default = Driver;
