"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importStar(require("axios"));
const json_bigint_1 = __importDefault(require("json-bigint"));
class ApiMix {
    constructor() {
        this.token = "";
        this.tokenRenew = null;
        this.localAxios = axios_1.default.create({
            baseURL: "https://integrate.us.mixtelematics.com",
            headers: {
                Authorization: `Bearer ${this.token ? this.token : ""}`,
            },
            timeout: 5000000,
            transformResponse: [
                (data) => {
                    try {
                        return json_bigint_1.default.parse(data);
                    }
                    catch (error) {
                        return data;
                    }
                },
            ],
        });
        // this.localAxios.interceptors.request.use((request) => {
        //   // request.transformResponse = [(data) => data]
        //   // console.log(request.)
        //   console.log(request.data)
        //   return request
        // })
        // this.localAxios.interceptors.response.use((response) => {
        //   console.log(response.status)
        //   console.log(response.data)
        //   return response
        // })
    }
    static getInstance() {
        if (!ApiMix.instance) {
            ApiMix.instance = new ApiMix();
        }
        return ApiMix.instance;
    }
    async getToken() {
        const maxRetries = 20; // Número máximo de tentativas
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const body = new URLSearchParams();
                body.append("grant_type", "password");
                body.append("username", process.env.MIX_USERNAME);
                body.append("password", process.env.MIX_PASSWORD);
                body.append("scope", "offline_access MiX.Integrate");
                const response = await this.localAxios.post("https://identity.us.mixtelematics.com/core/connect/token", body, {
                    auth: {
                        username: process.env.MIX_CLIENT_ID,
                        password: process.env.MIX_CLIENT_SECRET,
                    },
                });
                this.token = response.data.access_token;
                this.localAxios.defaults.headers.Authorization = `Bearer ${this.token}`;
                if (!this.tokenRenew) {
                    this.tokenRenew = setTimeout(() => {
                        this.getToken();
                    }, 1000 * 3600 - 100);
                }
                else {
                    clearTimeout(this.tokenRenew);
                    this.tokenRenew = setTimeout(() => {
                        this.getToken();
                    }, 1000 * 3600 - 100);
                }
                return this.token;
            }
            catch (error) {
                console.error(`Erro na tentativa ${attempt}:`, new Date());
                if (attempt === maxRetries) {
                    console.error("Número máximo de tentativas atingido. Lançando erro.");
                    if (error instanceof axios_1.AxiosError) {
                        console.error("Axios Error");
                        console.error(error);
                    }
                    throw error;
                }
                console.log(`Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`);
                await delay(60000); // Espera 2 segundos antes de tentar novamente
            }
        }
    }
    async listaCarros({ groupId }) {
        try {
            const response = await this.localAxios.get(`/api/assets/group/${groupId}`);
            return response.data;
        }
        catch (error) {
            console.error(error);
            if (error instanceof axios_1.AxiosError) {
                console.error("Axios Error");
                console.error(error);
            }
            throw error;
        }
    }
    async carregaViagens({ orgId, token, }) {
        try {
            const options = {
                method: "POST",
                url: `https://integrate.us.mixtelematics.com/api/trips/groups/createdsince/entitytype/Asset/sincetoken/${token}/quantity/1000`,
                params: { includeSubTrips: "true" },
                headers: {
                    "Content-Type": "application/json",
                },
                data: json_bigint_1.default.stringify([orgId]),
            };
            const response = await this.localAxios.request(options);
            const { getsincetoken } = response.headers;
            const data = response.data;
            return {
                getsincetoken,
                viagens: data,
            };
        }
        catch (error) {
            console.error(error);
            if (error instanceof axios_1.AxiosError) {
                console.error("Axios Error");
                console.error(error);
            }
            throw error;
        }
    }
    async listaEventosCarroPorDataST({ groupId, token, codigosEventos, }) {
        try {
            const options = {
                method: "POST",
                url: `https://integrate.us.mixtelematics.com/api/events/groups/createdsince/organisation/${groupId}/sincetoken/${token}/quantity/1000`,
                // params: { includeSubTrips: "true" },
                headers: {
                    "Content-Type": "application/json",
                },
                data: json_bigint_1.default.stringify(codigosEventos.map((codigo) => BigInt(codigo))),
            };
            const response = await this.localAxios.request(options);
            const { getsincetoken, hasmoreitems } = response.headers;
            return {
                getsincetoken,
                hasmoreitems,
                eventos: response.data,
                status: response.status,
            };
        }
        catch (error) {
            console.error(error);
            if (error instanceof axios_1.AxiosError) {
                console.error("Axios Error");
                console.error(error);
            }
            throw error;
        }
    }
    async listaMotoristas({ groupId }) {
        try {
            const response = await this.localAxios.get(`/api/drivers/organisation/${groupId}`);
            return response.data;
        }
        catch (error) {
            console.error(error);
            if (error instanceof axios_1.AxiosError) {
                console.error("Axios Error");
                console.error(error);
            }
            throw error;
        }
    }
    async listarPosicoes({ groupId, token, }) {
        try {
            const options = {
                method: "POST",
                url: `https://integrate.us.mixtelematics.com/api/positions/groups/createdsince/entitytype/Asset/sincetoken/${token}/quantity/1000`,
                headers: {
                    "Content-Type": "application/json",
                },
                data: json_bigint_1.default.stringify([BigInt(groupId)]),
            };
            const response = await this.localAxios.request(options);
            const { getsincetoken, hasmoreitems } = response.headers;
            return {
                getsincetoken,
                hasmoreitems,
                posicoes: response.data,
                status: response.status,
            };
        }
        catch (error) {
            console.error(error);
            if (error instanceof axios_1.AxiosError) {
                console.error("Axios Error");
                console.error(error);
            }
            throw error;
        }
    }
    async buscarPosicoesPorCarroData({ assets, start, end, }) {
        const maxRetries = 20; // Número máximo de tentativas
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const options = {
                    method: "POST",
                    url: `https://integrate.us.mixtelematics.com/api/positions/assets/from/${start}/to/${end}`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: json_bigint_1.default.stringify(assets.map((asset) => BigInt(asset))),
                };
                const response = await this.localAxios.request(options);
                console.log(" ");
                console.log(response.status);
                console.log(response.statusText);
                console.log(response.data.length);
                return response.data;
            }
            catch (error) {
                console.error(`Erro na tentativa ${attempt}:`, new Date());
                if (attempt === maxRetries) {
                    console.error("Número máximo de tentativas atingido. Lançando erro.");
                    if (error instanceof axios_1.AxiosError) {
                        console.error("Axios Error");
                        console.error(error);
                    }
                    throw error;
                }
                console.log(`Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`);
                await delay(60000); // Espera 2 segundos antes de tentar novamente
            }
        }
    }
    async getTripsByAsset({ assets, start, end, }) {
        const maxRetries = 20; // Número máximo de tentativas
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const options = {
                    method: "POST",
                    url: `https://integrate.us.mixtelematics.com/api/trips/assets/from/${start}/to/${end}`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: json_bigint_1.default.stringify(assets.map((asset) => BigInt(asset))),
                };
                const response = await this.localAxios.request(options);
                console.log(" ");
                console.log(response.status);
                console.log(response.statusText);
                console.log(response.data.length);
                return response.data;
            }
            catch (error) {
                console.error(`Erro na tentativa ${attempt}:`, new Date());
                console.log(error.response.status);
                console.log(error.response.data);
                if (attempt === maxRetries) {
                    console.error("Número máximo de tentativas atingido. Lançando erro.");
                    if (error instanceof axios_1.AxiosError) {
                        console.error("Axios Error");
                        console.error(error);
                    }
                    throw error;
                }
                console.log(`Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`);
                await delay(60000); // Espera 2 segundos antes de tentar novamente
            }
        }
    }
    async getEventTypes({ orgId }) {
        const maxRetries = 20; // Número máximo de tentativas
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const options = {
                    method: "GET",
                    url: `https://integrate.us.mixtelematics.com/api/libraryevents/organisation/${orgId}`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    // data: JSONBig.stringify(assets.map((asset) => BigInt(asset))),
                };
                const response = await this.localAxios.request(options);
                return response.data;
            }
            catch (error) {
                console.error(`Erro na tentativa ${attempt}:`, new Date());
                if (attempt === maxRetries) {
                    console.error("Número máximo de tentativas atingido. Lançando erro.");
                    if (error instanceof axios_1.AxiosError) {
                        console.error("Axios Error");
                        console.error(error);
                    }
                    throw error;
                }
                console.log(`Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`);
                await delay(60000); // Espera 2 segundos antes de tentar novamente
            }
        }
    }
    async getEventByAssets({ assets, tempEventTypes, start, end, }) {
        const maxRetries = 20; // Número máximo de tentativas
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const options = {
                    method: "POST",
                    url: `https://integrate.us.mixtelematics.com/api/events/assets/from/${start}/to/${end}`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: json_bigint_1.default.stringify({
                        EntityIds: assets.map((asset) => BigInt(asset)),
                        EventTypeIds: tempEventTypes.map((eventType) => BigInt(eventType)),
                    }),
                };
                const response = await this.localAxios.request(options);
                console.log(" ");
                console.log(response.status);
                console.log(response.statusText);
                console.log(response.data.length);
                return response.data;
            }
            catch (error) {
                console.error(`Erro na tentativa ${attempt}:`, new Date());
                if (attempt === maxRetries) {
                    console.error("Número máximo de tentativas atingido. Lançando erro.");
                    if (error instanceof axios_1.AxiosError) {
                        console.error("Axios Error");
                        console.error(error);
                    }
                    throw error;
                }
                console.log(`Aguardando antes da próxima tentativa... (${attempt} de ${maxRetries})`);
                await delay(60000); // Espera 2 segundos antes de tentar novamente
            }
        }
    }
}
exports.default = ApiMix;
