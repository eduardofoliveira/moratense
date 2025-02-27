"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connectionManagerHomeLab_1 = __importDefault(require("../database/connectionManagerHomeLab"));
const date_fns_1 = require("date-fns");
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Summary {
    static async getSummary({ start, end, }) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const quantidade = db.raw(`
      SELECT
        count(distinct assetId) AS veiculos
      FROM
        trips
      WHERE
        tripStart BETWEEN '${start}' AND '${end}'
    `);
        const consumo = db.raw(`
      SELECT
        SUM(distanceKilometers) AS kms_rodados,
        SUM(fuelUsedLitres) AS litros_consumidos
      FROM
        trips
      WHERE
        tripStart BETWEEN '${start}' AND '${end}'
    `);
        const result = await Promise.all([quantidade, consumo]);
        const resultQuantidade = result[0][0][0];
        const resultConsumo = result[1][0][0];
        return {
            assetsQuantity: resultQuantidade.veiculos,
            distanceKilometers: resultConsumo.kms_rodados,
            fuelUsedLitres: resultConsumo.litros_consumidos,
        };
    }
    static async getTrips({ start, end, }) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        const [trips] = await db.raw(`
      SELECT
        c.numero_chassi,
        a.description,
        gf.chapa,
        gf.codigo,
        gf.codigo_funcionario,
        gf.nome,
        gl.nome_linha,
        gv.data_saida_garagem,
        gv.data_recolhido,
        gv.assetId,
        gv.driverId,
        CONCAT(c.numero_chassi, ' - ', gl.nome_linha) AS chassi_linha
      FROM
        globus_viagem gv,
        globus_linha gl,
        globus_funcionario gf,
        asset_chassi ac,
        chassi c,
        assets a
      WHERE
        gv.data_saida_garagem BETWEEN '${start}' AND '${end}' and
        gv.fk_id_globus_linha = gl.id and
        gv.fk_id_globus_funcionario = gf.id and
        ac.assetId = gv.assetId and
        ac.fk_id_chassi = c.id and
        a.assetId = ac.assetId
      ORDER BY
        gv.data_saida_garagem ASC,
        chassi_linha asc
    `);
        return trips;
    }
    static async getConsumption({ assetId, driverId, start, end, }) {
        const db = connectionManagerHomeLab_1.default.getConnection();
        let [consumption] = await db.raw(`
      SELECT
        t.id,
        t.tripId,
        t.distanceKilometers,
        t.fuelUsedLitres,
        t.tripStart,
        t.tripEnd
      FROM
        trips t
      WHERE
        t.assetId = '${assetId}' and
        ABS(TIMESTAMPDIFF(SECOND, t.tripStart, '${start}')) < 600
      ORDER BY
        ABS(TIMESTAMPDIFF(SECOND, t.tripStart, '${start}'))
      LIMIT 1
    `);
        if (consumption.length === 0) {
            const [consumption2] = await db.raw(`
        SELECT
          t.id,
          t.tripId,
          t.distanceKilometers,
          t.fuelUsedLitres,
          t.tripStart,
          t.tripEnd
        FROM
          trips t
        WHERE
          t.assetId = '${assetId}' and
          ABS(TIMESTAMPDIFF(SECOND, t.tripEnd, '${end}')) < 600
      `);
            consumption = consumption2;
        }
        if (consumption.length === 0) {
            const [consumption3] = await db.raw(`
        SELECT
          t.id,
          t.tripId,
          t.distanceKilometers,
          t.fuelUsedLitres,
          t.tripStart,
          t.tripEnd
        FROM
          trips t
        WHERE
          t.assetId = '${assetId}' and
          '${start}' BETWEEN t.tripStart AND t.tripEnd
      `);
            consumption = consumption3;
        }
        for await (const item of consumption) {
            item.tripStart = (0, date_fns_1.format)(new Date(item.tripStart), "dd/MM/yyyy HH:mm:ss");
            item.tripEnd = (0, date_fns_1.format)(new Date(item.tripEnd), "dd/MM/yyyy HH:mm:ss");
        }
        return consumption;
    }
}
exports.default = Summary;
