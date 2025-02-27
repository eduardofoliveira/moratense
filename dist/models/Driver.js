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
    static async findMixCode(driverId) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Driver.tableName).where({ driverId }).first();
    }
    static async create(driver) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [id] = await db(Driver.tableName).insert(driver);
        return id;
    }
    static async update(id, driver) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(Driver.tableName).where({ id }).update(driver);
    }
    static async delete(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(Driver.tableName).where({ id }).delete();
    }
}
Driver.tableName = "drivers";
exports.default = Driver;
