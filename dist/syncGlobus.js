"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
// import fs from "node:fs/promises"
const date_fns_1 = require("date-fns");
const connectionManagerOracle_1 = __importDefault(require("./database/connectionManagerOracle"));
const connectionManager_1 = __importDefault(require("./database/connectionManager"));
const GlobusCarro_1 = __importDefault(require("./models/GlobusCarro"));
const Asset_1 = __importDefault(require("./models/Asset"));
const Driver_1 = __importDefault(require("./models/Driver"));
const GlobusLinha_1 = __importDefault(require("./models/GlobusLinha"));
const GlobusFuncionario_1 = __importDefault(require("./models/GlobusFuncionario"));
const GlobusViagem_1 = __importDefault(require("./models/GlobusViagem"));
// const execute = async () => {
//   const start = "2025-02-01 00:00:00"
//   const end = "2025-02-07 23:59:59"
//   const db = DbOracle.getConnection()
//   await new Promise((resolve) => setTimeout(resolve, 5000))
//   const data = await db.raw(`
//     select
//       to_char( t_arr_viagens_guia.QTD_HORA_INI , 'yyyy-mm-dd' ) dt,
//       prefixoveic,
//       l.codigolinha,
//       l.nomelinha,
//       codigoorgconc,
//   	  '' cod_servdiaria,
//       to_char( t_arr_viagens_guia.QTD_HORA_INI , 'yyyy-mm-dd hh24:mi:ss' ) dti,
//       to_char( t_arr_viagens_guia.QTD_HORA_FINAL , 'yyyy-mm-dd hh24:mi:ss' ) dtf,
//   	  frt_cadveiculos.CODIGOTPFROTA cdft,
//       fm.codfunc f1cod,
//       fm.apelidofunc f1ap,
//       fm.nomefunc f1nome,
//       to_char( t_arr_viagens_guia.QTD_HORA_INI , 'yyyy-mm-dd hh24:mi:ss' ) dtg
//   	from
//       t_arr_viagens_guia
//       left join frt_cadveiculos
//         on frt_cadveiculos.codigoveic = t_arr_viagens_guia.COD_VEICULO
//   		Join bgm_cadlinhas l
//         on t_arr_viagens_guia.cod_intlinha = l.codintlinha
//       left join T_ARR_TROCAS_FUNC
//         on T_ARR_TROCAS_FUNC.COD_SEQ_GUIA = t_arr_viagens_guia.COD_SEQ_GUIA and FLG_MOT_COB = 'M'
//   		left Join flp_funcionarios fm
//         on fm.CODINTFUNC = T_ARR_TROCAS_FUNC.CODINTFUNC
//   	where
//       t_arr_viagens_guia.QTD_HORA_INI between to_date('${start}','yyyy-mm-dd hh24:mi:ss') and to_date('${end}','yyyy-mm-dd hh24:mi:ss')
//   `)
//   fs.writeFile("./globus.json", JSON.stringify(data, null, 2))
//   await db.destroy()
// }
const syncCarrosGlobus = async () => {
    const idEmpresa = 4;
    try {
        const db = connectionManagerOracle_1.default.getConnection();
        const dbTeleconsult = connectionManager_1.default.getConnection();
        let data = await db.raw(`
        select
          codigoveic,
          CODIGOTPFROTA,
          placaatualveic,
          prefixoveic,
          condicaoveic,
          CODIGOEMPRESA
        from
          FRT_CADVEICULOS
        -- where
          -- CODIGOEMPRESA = idEmpresa
        order by
          PREFIXOVEIC
    `);
        const carros = await Asset_1.default.getAll();
        const [carrosWithChassi] = await dbTeleconsult.raw(`
      SELECT
        c.id,
        c.id_empresa,
        c.codigo AS codigo_carro,
        ch.codigo AS chassi
      FROM
        carros c,
        carros_chassis cc,
        chassis ch
      WHERE
        c.id_empresa = 4 and
        cc.id_carro = c.id and
        cc.id_chassi = ch.id
    `);
        data = data.map((carroGlobus) => {
            const asset = carros.find((carro) => Number.parseInt(carro.description, 10) ===
                Number.parseInt(carroGlobus.PREFIXOVEIC, 10));
            const chassi = carrosWithChassi.find((chassi) => {
                if (Number.parseInt(chassi.codigo_carro, 10) ===
                    Number.parseInt(carroGlobus.PREFIXOVEIC, 10)) {
                    return true;
                }
                return false;
            });
            let temp = carroGlobus;
            if (asset) {
                temp = { ...carroGlobus, assetId: asset.assetId };
            }
            if (chassi) {
                temp = { ...temp, chassi: chassi.chassi };
            }
            return temp;
        });
        // await db.destroy()
        // await dbTeleconsult.destroy()
        console.log(data.length);
        for await (const carroGlobus of data) {
            const carroGlobusExists = await GlobusCarro_1.default.findByCodigoVeiculo(carroGlobus.CODIGOVEIC);
            if (!carroGlobusExists) {
                await GlobusCarro_1.default.create({
                    id_empresa: idEmpresa,
                    codigo_veiculo: carroGlobus.CODIGOVEIC,
                    codigo_frota: carroGlobus.CODIGOTPFROTA,
                    placa: carroGlobus.PLACAATUALVEIC,
                    prefixo: carroGlobus.PREFIXOVEIC,
                    condicao: carroGlobus.CONDICAOVEIC,
                    assetId: carroGlobus.assetId ? carroGlobus.assetId : null,
                    chassi: carroGlobus.chassi ? carroGlobus.chassi : null,
                });
            }
            else {
                await GlobusCarro_1.default.update(carroGlobusExists.id, {
                    id_empresa: idEmpresa,
                    codigo_veiculo: carroGlobus.CODIGOVEIC,
                    codigo_frota: carroGlobus.CODIGOTPFROTA,
                    placa: carroGlobus.PLACAATUALVEIC,
                    prefixo: carroGlobus.PREFIXOVEIC,
                    condicao: carroGlobus.CONDICAOVEIC,
                    assetId: carroGlobus.assetId ? carroGlobus.assetId : null,
                    chassi: carroGlobus.chassi ? carroGlobus.chassi : null,
                    updated_at: new Date(),
                });
            }
        }
        console.log("syncCarrosGlobus: fim");
    }
    catch (error) {
        console.error(error);
    }
};
const syncLinhasGlobus = async () => {
    try {
        const idEmpresa = 4;
        const db = connectionManagerOracle_1.default.getConnection();
        const data = await db.raw(`
        select
          CODIGOORGCONC,
          CODIGOLINHA,
          NROFICIALLINHA,
          NOMELINHA,
          CODIGOEMPRESA
        from
          bgm_cadlinhas
        where
          -- CODIGOEMPRESA = idEmpresa AND
          CODIGOORGCONC is not null
        order by
          CODIGOLINHA
    `);
        for await (const linhaGlobus of data) {
            const linhaGlobusExists = await GlobusLinha_1.default.findByCodigoAndFilial(linhaGlobus.CODIGOLINHA, linhaGlobus.CODIGOORGCONC);
            if (!linhaGlobusExists) {
                await GlobusLinha_1.default.create({
                    id_empresa: idEmpresa,
                    codigo_filial: linhaGlobus.CODIGOORGCONC,
                    codigo_linha: linhaGlobus.CODIGOLINHA,
                    nome_linha: linhaGlobus.NOMELINHA,
                    numero_oficial_linha: linhaGlobus.NROFICIALLINHA,
                });
            }
            else {
                await GlobusLinha_1.default.update(linhaGlobusExists.id, {
                    id_empresa: idEmpresa,
                    codigo_filial: linhaGlobus.CODIGOORGCONC,
                    codigo_linha: linhaGlobus.CODIGOLINHA,
                    nome_linha: linhaGlobus.NOMELINHA,
                    numero_oficial_linha: linhaGlobus.NROFICIALLINHA,
                    updated_at: new Date(),
                });
            }
        }
        console.log("syncLinhasGlobus: fim");
    }
    catch (error) {
        console.error(error);
    }
};
const syncFuncionariosGlobus = async () => {
    try {
        const idEmpresa = 4;
        const db = connectionManagerOracle_1.default.getConnection();
        const data = await db.raw(`
      select
        f.codintfunc,
        f.chapafunc,
        f.nomefunc,
        f.codfunc,
        f.apelidofunc,
        f.codigoempresa
      from
        flp_funcionarios f
      where
        -- f.CODIGOEMPRESA = idEmpresa and
        f.SITUACAOFUNC = 'A'
    `);
        const motoristas = await Driver_1.default.getAll();
        for (const funcionarioGlobus of data) {
            const findMotorista = motoristas.find((item) => item.employeeNumber ===
                Number.parseInt(funcionarioGlobus.CHAPAFUNC, 10));
            const funcionarioGlobusExists = await GlobusFuncionario_1.default.findByChapa(funcionarioGlobus.CHAPAFUNC);
            if (!funcionarioGlobusExists) {
                await GlobusFuncionario_1.default.create({
                    id_empresa: idEmpresa,
                    codigo: funcionarioGlobus.CODFUNC,
                    codigo_funcionario: funcionarioGlobus.CODINTFUNC,
                    apelido: funcionarioGlobus.APELIDOFUNC,
                    chapa: funcionarioGlobus.CHAPAFUNC,
                    driverId: findMotorista
                        ? findMotorista.driverId.toString()
                        : undefined,
                    nome: funcionarioGlobus.NOMEFUNC,
                });
            }
            else {
                await GlobusFuncionario_1.default.update(funcionarioGlobusExists.id, {
                    id_empresa: idEmpresa,
                    codigo: funcionarioGlobus.CODFUNC,
                    codigo_funcionario: funcionarioGlobus.CODINTFUNC,
                    apelido: funcionarioGlobus.APELIDOFUNC,
                    chapa: funcionarioGlobus.CHAPAFUNC,
                    driverId: findMotorista
                        ? findMotorista.driverId.toString()
                        : undefined,
                    nome: funcionarioGlobus.NOMEFUNC,
                    updated_at: new Date(),
                });
            }
        }
        console.log("syncFuncionariosGlobus: fim");
    }
    catch (error) {
        console.error(error);
    }
};
const syncViagensGlobus = async () => {
    const today = new Date();
    const inicio = (0, date_fns_1.format)((0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(today, 2)), "yyyy-MM-dd 00:00:00");
    const termino = (0, date_fns_1.format)((0, date_fns_1.endOfDay)((0, date_fns_1.subDays)(today, 1)), "yyyy-MM-dd 23:59:59");
    // const inicio = "2025-02-15 00:00:00"
    // const termino = "2025-02-18 23:59:59"
    try {
        const idEmpresa = 4;
        const db = connectionManagerOracle_1.default.getConnection();
        const data = await db.raw(`
      select
        to_char( t_arr_viagens_guia.QTD_HORA_INI , 'yyyy-mm-dd' ) dt,
        prefixoveic,
        l.codigolinha,
        l.nomelinha,
        codigoorgconc,
        '' cod_servdiaria,
        to_char( t_arr_viagens_guia.QTD_HORA_INI , 'yyyy-mm-dd hh24:mi:ss' ) dti,
        to_char( t_arr_viagens_guia.QTD_HORA_FINAL , 'yyyy-mm-dd hh24:mi:ss' ) dtf,
        frt_cadveiculos.CODIGOTPFROTA cdft,
        fm.codfunc f1cod,
        fm.apelidofunc f1ap,
        fm.nomefunc f1nome,
        to_char( t_arr_viagens_guia.QTD_HORA_INI , 'yyyy-mm-dd hh24:mi:ss' ) dtg,
        frt_cadveiculos.CODIGOEMPRESA
      from
        t_arr_viagens_guia
        left join frt_cadveiculos
          on frt_cadveiculos.codigoveic = t_arr_viagens_guia.COD_VEICULO
        Join bgm_cadlinhas l
          on t_arr_viagens_guia.cod_intlinha = l.codintlinha
        left join T_ARR_TROCAS_FUNC
          on T_ARR_TROCAS_FUNC.COD_SEQ_GUIA = t_arr_viagens_guia.COD_SEQ_GUIA and FLG_MOT_COB = 'M'
        left Join flp_funcionarios fm
          on fm.CODINTFUNC = T_ARR_TROCAS_FUNC.CODINTFUNC
      where
        -- frt_cadveiculos.CODIGOEMPRESA = id_empresa and
        t_arr_viagens_guia.QTD_HORA_INI between to_date('${inicio}','yyyy-mm-dd hh24:mi:ss') and to_date('${termino}','yyyy-mm-dd hh24:mi:ss')
    `);
        for await (const viagemGlobus of data) {
            const linhaGlobus = await GlobusLinha_1.default.findByCodigoAndFilial(viagemGlobus.CODIGOLINHA, Number.parseInt(viagemGlobus.CODIGOORGCONC, 10));
            const funcioarioGlobus = await GlobusFuncionario_1.default.findByCodigo(viagemGlobus.F1COD);
            const carroGlobus = await GlobusCarro_1.default.findByPrefixo(viagemGlobus.PREFIXOVEIC);
            if (!linhaGlobus || !funcioarioGlobus || !carroGlobus) {
                console.log({
                    CODIGOLINHA: viagemGlobus.CODIGOLINHA,
                    CODIGOORGCONC: viagemGlobus.CODIGOORGCONC,
                    F1COD: viagemGlobus.F1COD,
                    PREFIXOVEIC: viagemGlobus.PREFIXOVEIC,
                    assetId: carroGlobus ? carroGlobus.assetId : undefined,
                    driverId: funcioarioGlobus ? funcioarioGlobus.driverId : undefined,
                    fk_id_globus_linha: linhaGlobus ? linhaGlobus.id : undefined,
                    fk_id_globus_funcionario: funcioarioGlobus
                        ? funcioarioGlobus.id
                        : undefined,
                    data_recolhido: (0, date_fns_1.format)(new Date(viagemGlobus.DTF), "yyyy-MM-dd HH:mm:ss"),
                    data_saida_garagem: (0, date_fns_1.format)(new Date(viagemGlobus.DTI), "yyyy-MM-dd HH:mm:ss"),
                });
            }
            const viagemGlobusExists = await GlobusViagem_1.default.find(carroGlobus ? carroGlobus.assetId : undefined, funcioarioGlobus ? funcioarioGlobus.driverId : undefined, Number.parseInt(viagemGlobus.CODIGOORGCONC, 10), viagemGlobus.CDFT, new Date(viagemGlobus.DTF), new Date(viagemGlobus.DTI), funcioarioGlobus ? funcioarioGlobus.id : undefined, linhaGlobus ? linhaGlobus.id : undefined);
            if (!viagemGlobusExists) {
                try {
                    await GlobusViagem_1.default.create({
                        id_empresa: idEmpresa,
                        assetId: carroGlobus ? carroGlobus.assetId : undefined,
                        driverId: funcioarioGlobus ? funcioarioGlobus.driverId : undefined,
                        codigo_filial: Number.parseInt(viagemGlobus.CODIGOORGCONC, 10),
                        codigo_frota: viagemGlobus.CDFT,
                        data_recolhido: new Date(viagemGlobus.DTF),
                        data_saida_garagem: new Date(viagemGlobus.DTI),
                        fk_id_globus_funcionario: funcioarioGlobus
                            ? funcioarioGlobus.id
                            : undefined,
                        fk_id_globus_linha: linhaGlobus ? linhaGlobus.id : undefined,
                    });
                }
                catch (error) {
                    console.log(error);
                    console.log({ linhaGlobus });
                    console.log({ funcioarioGlobus });
                    console.log({ carroGlobus });
                    console.log({ viagemGlobus });
                    console.log({
                        id_empresa: idEmpresa,
                        assetId: carroGlobus ? carroGlobus.assetId : undefined,
                        driverId: funcioarioGlobus ? funcioarioGlobus.driverId : undefined,
                        codigo_filial: Number.parseInt(viagemGlobus.CODIGOORGCONC, 10),
                        codigo_frota: viagemGlobus.CDFT,
                        data_recolhido: new Date(viagemGlobus.DTF),
                        data_saida_garagem: new Date(viagemGlobus.DTI),
                        fk_id_globus_funcionario: funcioarioGlobus
                            ? funcioarioGlobus.id
                            : undefined,
                        fk_id_globus_linha: linhaGlobus ? linhaGlobus.id : undefined,
                    });
                }
            }
        }
        console.log(data.length);
        console.log("syncViagensGlobus: fim");
    }
    catch (error) {
        console.error(error);
    }
};
const sync = async () => {
    await syncCarrosGlobus();
    await syncLinhasGlobus();
    await syncFuncionariosGlobus();
    await syncViagensGlobus();
    process.exit(0);
};
sync();
// execute()
// syncCarrosGlobus()
// syncLinhasGlobus()
// syncFuncionariosGlobus()
// syncViagensGlobus()
