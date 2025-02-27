"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const axios_1 = __importDefault(require("axios"));
const showTelemetriaTiposEvento_1 = __importDefault(require("./use-cases/telemetriaTiposEvento/showTelemetriaTiposEvento"));
const updateDrankTelConfig_1 = __importDefault(require("./use-cases/drankTelConfig/updateDrankTelConfig"));
const showDrankTelConfig_1 = __importDefault(require("./use-cases/drankTelConfig/showDrankTelConfig"));
const showEmpresa_1 = __importDefault(require("./use-cases/empresa/showEmpresa"));
const api_mix_1 = __importDefault(require("./service/api.mix"));
const sincronizarPosicoes = async ({ token }) => {
    const empresa = await (0, showEmpresa_1.default)({ id: 4 });
    const apiMix = api_mix_1.default.getInstance();
    await apiMix.getToken();
    const response = await apiMix.listarPosicoes({
        groupId: empresa.mix_groupId,
        token,
    });
    const { getsincetoken, hasmoreitems, posicoes, status } = response;
    console.log(`Token: ${getsincetoken}`);
    console.log(`Posições: ${posicoes.length}`);
    console.log({ status });
    const { data } = await axios_1.default.post("http://teleconsult.com.br:3000/data/posicoes", {
        posicoes,
    });
    console.log("Posições inseridos");
    console.log(data);
    await (0, updateDrankTelConfig_1.default)({
        name: "sinceTokenPositions",
        value: getsincetoken,
    });
    // if (response.status === 206) {
    //   await sincronizarPosicoes({ token: getsincetoken })
    // }
    // if (response.status === 200) {
    //   setTimeout(async () => {
    //     await sincronizarPosicoes({ token: getsincetoken })
    //   }, 60000)
    // }
};
const executarPosicoes = async () => {
    try {
        const configEvento = await (0, showDrankTelConfig_1.default)({
            name: "sinceTokenPositions",
        });
        await sincronizarPosicoes({ token: configEvento.valor });
        console.log("posições inseridas");
    }
    catch (error) {
        console.log(error);
        // setTimeout(async () => {
        //   executarPosicoes()
        // }, 60000)
    }
};
const sincronizarEventos = async ({ token }) => {
    const empresa = await (0, showEmpresa_1.default)({ id: 4 });
    const eventosDb = await (0, showTelemetriaTiposEvento_1.default)({
        id_empresa: 4,
    });
    const codigosEventos = [];
    for (const evento of eventosDb) {
        if (evento.carregar === 1) {
            codigosEventos.push(evento.codigo);
        }
    }
    const apiMix = api_mix_1.default.getInstance();
    await apiMix.getToken();
    const response = await apiMix.listaEventosCarroPorDataST({
        groupId: empresa.mix_groupId,
        codigosEventos,
        token,
    });
    const eventos = response.eventos;
    const getsincetoken = response.getsincetoken;
    console.log(response.status);
    console.log(`Token: ${getsincetoken}`);
    console.log(`Eventos: ${eventos.length}`);
    const { data } = await axios_1.default.post("http://teleconsult.com.br:3000/data/eventos", {
        eventos,
    });
    console.log("Eventos inseridos");
    console.log(data);
    await (0, updateDrankTelConfig_1.default)({
        name: "sinceTokenEvents",
        value: getsincetoken,
    });
    // if (response.status === 206) {
    //   await sincronizarEventos({ token: getsincetoken })
    // }
    // if (response.status === 200) {
    //   setTimeout(async () => {
    //     await sincronizarEventos({ token: getsincetoken })
    //   }, 60000)
    // }
};
const executarEventos = async () => {
    try {
        const configEvento = await (0, showDrankTelConfig_1.default)({ name: "sinceTokenEvents" });
        await sincronizarEventos({ token: configEvento.valor });
        console.log("eventos inseridas");
    }
    catch (error) {
        console.error(error);
        // setTimeout(async () => {
        //   executarEventos()
        // }, 60000)
    }
};
const executar = async () => {
    await executarPosicoes();
    await executarEventos();
    process.exit(0);
};
executar();
