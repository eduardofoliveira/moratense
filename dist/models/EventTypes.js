"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManagerHomeLab_1 = __importDefault(require("../database/connectionManagerHomeLab"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class EventTypes {
    static async getAll() {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(EventTypes.tableName).select("*");
    }
    static async getAllActiveItensCarregar({ id_empresa, }) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(EventTypes.tableName)
            .select("*")
            .where({ carregar: true, id_empresa });
    }
    static async getById(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(EventTypes.tableName).where({ id }).first();
    }
    static async findMixCode(eventTypeId) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(EventTypes.tableName).where({ eventTypeId }).first();
    }
    static async create(eventType) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [id] = await db(EventTypes.tableName).insert(eventType);
        return id;
    }
    static async update(id, eventType) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(EventTypes.tableName).where({ id }).update(eventType);
    }
    static async delete(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(EventTypes.tableName).where({ id }).delete();
    }
}
EventTypes.tableName = "eventType";
exports.default = EventTypes;
