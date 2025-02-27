"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const Summary_1 = __importDefault(require("../models/Summary"));
const index = async (req, res) => {
    const { start, end } = req.query;
    const result = Summary_1.default.getSummary({
        start: start,
        end: end,
    });
    const trips = await Summary_1.default.getTrips({
        start: start,
        end: end,
    });
    let temConsumo = 0;
    let naoTemConsumo = 0;
    let distanceKilometers = 0;
    let fuelUsedLitres = 0;
    for await (const trip of trips) {
        const consumo = await Summary_1.default.getConsumption({
            assetId: trip.assetId,
            driverId: trip.driverId,
            start: (0, date_fns_1.format)(new Date(trip.data_saida_garagem), "yyyy-MM-dd HH:mm:ss"),
            end: (0, date_fns_1.format)(new Date(trip.data_recolhido), "yyyy-MM-dd HH:mm:ss"),
        });
        trip.consumo = consumo;
        if (consumo.length === 1) {
            temConsumo++;
            distanceKilometers =
                distanceKilometers + Number.parseFloat(consumo[0].distanceKilometers);
            fuelUsedLitres =
                fuelUsedLitres + Number.parseFloat(consumo[0].fuelUsedLitres);
        }
        else if (consumo.length > 1) {
            temConsumo++;
            for await (const item of consumo) {
                distanceKilometers =
                    distanceKilometers + Number.parseFloat(item.distanceKilometers);
                fuelUsedLitres = fuelUsedLitres + Number.parseFloat(item.fuelUsedLitres);
            }
        }
        else {
            naoTemConsumo++;
        }
        trip.data_saida_garagem = (0, date_fns_1.format)(new Date(trip.data_saida_garagem), "dd-MM-yyyy HH:mm:ss");
        trip.data_recolhido = (0, date_fns_1.format)(new Date(trip.data_recolhido), "dd-MM-yyyy HH:mm:ss");
    }
    // const filtredTrips = trips.filter((trip) => trip.consumo.length > 0)
    const [result1] = await Promise.all([result]);
    return res.json({
        summary: result1,
        temConsumo,
        naoTemConsumo,
        distanceKilometers,
        fuelUsedLitres,
        trips: trips,
    });
};
exports.default = {
    index,
};
