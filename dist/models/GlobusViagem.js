"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManagerHomeLab_1 = __importDefault(require("../database/connectionManagerHomeLab"));
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class GlobusViagem {
    static async getAll() {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusViagem.tableName).select("*");
    }
    static async getById(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusViagem.tableName).where({ id }).first();
    }
    static async find(assetId, driverId, codigo_filial, codigo_frota, data_recolhido, data_saida_garagem, fk_id_globus_funcionario, fk_id_globus_linha) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        return db(GlobusViagem.tableName)
            .where({
            assetId,
            driverId,
            codigo_filial,
            codigo_frota,
            data_recolhido,
            data_saida_garagem,
            fk_id_globus_funcionario,
            fk_id_globus_linha,
        })
            .first();
    }
    static async create(viagem) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [id] = await db(GlobusViagem.tableName).insert(viagem);
        return id;
    }
    static async update(id, viagem) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(GlobusViagem.tableName).where({ id }).update(viagem);
    }
    static async delete(id) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        await db(GlobusViagem.tableName).where({ id }).delete();
    }
}
GlobusViagem.tableName = "globus_viagem";
exports.default = GlobusViagem;
