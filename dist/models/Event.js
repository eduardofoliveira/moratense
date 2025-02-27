"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManagerHomeLab_1 = __importDefault(require("../database/connectionManagerHomeLab"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Event {
    static async getAll() {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Event.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Event.tableName).where({ id }).first();
    }
    static async findMixCode(eventId) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(Event.tableName).where({ eventId }).first();
    }
    static async create(event) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [id] = await db(Event.tableName).insert(event);
        return id;
    }
    static async update(id, event) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(Event.tableName).where({ id }).update(event);
    }
    static async delete(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(Event.tableName).where({ id }).delete();
    }
}
Event.tableName = "events";
exports.default = Event;
