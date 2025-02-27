"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManagerHomeLab_1 = __importDefault(require("../database/connectionManagerHomeLab"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Position {
    static async getAll() {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Position.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Position.tableName).where({ id }).first();
    }
    static async findMixCode(positionId) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Position.tableName).where({ positionId }).first();
    }
    static async create(position) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [id] = await db(Position.tableName).insert(position);
        return id;
    }
    static async update(id, position) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(Position.tableName).where({ id }).update(position);
    }
    static async delete(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(Position.tableName).where({ id }).delete();
    }
}
Position.tableName = "positions";
exports.default = Position;
