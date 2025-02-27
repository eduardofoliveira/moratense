"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManagerHomeLab_1 = __importDefault(require("../database/connectionManagerHomeLab"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Trip {
    static async getAll() {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Trip.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Trip.tableName).where({ id }).first();
    }
    static async findMixCode(tripId) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Trip.tableName).where({ tripId }).first();
    }
    static async create(trip) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [id] = await db(Trip.tableName).insert(trip);
        return id;
    }
    static async update(id, trip) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(Trip.tableName).where({ id }).update(trip);
    }
    static async delete(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(Trip.tableName).where({ id }).delete();
    }
}
Trip.tableName = "trips";
exports.default = Trip;
