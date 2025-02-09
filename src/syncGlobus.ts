import "dotenv/config"
import fs from "node:fs/promises"

import DbOracle from "./database/connectionManagerOracle"
import DbTeleconsult from "./database/connectionManager"
import GlobusCarro from "./models/GlobusCarro"
import Asset from "./models/Asset"
import Driver from "./models/Driver"
import GlobusLinha from "./models/GlobusLinha"
import GlobusFuncionario from "./models/GlobusFuncionario"

const execute = async () => {
  const start = "2025-02-01 00:00:00"
  const end = "2025-02-07 23:59:59"

  const db = DbOracle.getConnection()

  await new Promise((resolve) => setTimeout(resolve, 5000))

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
      to_char( t_arr_viagens_guia.QTD_HORA_INI , 'yyyy-mm-dd hh24:mi:ss' ) dtg
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
      t_arr_viagens_guia.QTD_HORA_INI between to_date('${start}','yyyy-mm-dd hh24:mi:ss') and to_date('${end}','yyyy-mm-dd hh24:mi:ss')
  `)

  fs.writeFile("./globus.json", JSON.stringify(data, null, 2))

  await db.destroy()
}

const syncCarrosGlobus = async () => {
  const idEmpresa = 4

  try {
    const db = DbOracle.getConnection()
    const dbTeleconsult = DbTeleconsult.getConnection()

    let data = await db.raw(`
        select
          codigoveic,
          CODIGOTPFROTA,
          placaatualveic,
          prefixoveic,
          condicaoveic
        from
          FRT_CADVEICULOS
        where
          CODIGOEMPRESA = ${idEmpresa}
        order by
          PREFIXOVEIC
    `)

    const carros = await Asset.getAll()
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
    `)

    data = data.map((carroGlobus: any) => {
      const asset = carros.find(
        (carro) =>
          Number.parseInt(carro.description, 10) ===
          Number.parseInt(carroGlobus.PREFIXOVEIC, 10),
      )

      const chassi = carrosWithChassi.find((chassi: any) => {
        if (
          Number.parseInt(chassi.codigo_carro, 10) ===
          Number.parseInt(carroGlobus.PREFIXOVEIC, 10)
        ) {
          return true
        }
        return false
      })

      let temp = carroGlobus

      if (asset) {
        temp = { ...carroGlobus, assetId: asset.assetId }
      }

      if (chassi) {
        temp = { ...temp, chassi: chassi.chassi }
      }

      return temp
    })

    await db.destroy()
    await dbTeleconsult.destroy()

    console.log(data.length)

    for await (const carroGlobus of data) {
      const carroGlobusExists = await GlobusCarro.findByCodigoVeiculo(
        carroGlobus.CODIGOVEIC,
      )

      if (!carroGlobusExists) {
        await GlobusCarro.create({
          id_empresa: idEmpresa,
          codigo_veiculo: carroGlobus.CODIGOVEIC,
          codigo_frota: carroGlobus.CODIGOTPFROTA,
          placa: carroGlobus.PLACAATUALVEIC,
          prefixo: carroGlobus.PREFIXOVEIC,
          condicao: carroGlobus.CONDICAOVEIC,
          assetId: carroGlobus.assetId ? carroGlobus.assetId : null,
          chassi: carroGlobus.chassi ? carroGlobus.chassi : null,
        })
      } else {
        await GlobusCarro.update(carroGlobusExists.id, {
          id_empresa: idEmpresa,
          codigo_veiculo: carroGlobus.CODIGOVEIC,
          codigo_frota: carroGlobus.CODIGOTPFROTA,
          placa: carroGlobus.PLACAATUALVEIC,
          prefixo: carroGlobus.PREFIXOVEIC,
          condicao: carroGlobus.CONDICAOVEIC,
          assetId: carroGlobus.assetId ? carroGlobus.assetId : null,
          chassi: carroGlobus.chassi ? carroGlobus.chassi : null,
          updated_at: new Date(),
        })
      }
    }

    console.log("syncCarrosGlobus: fim")
  } catch (error) {
    console.error(error)
  }
}

const syncLinhasGlobus = async () => {
  try {
    const idEmpresa = 4
    const db = DbOracle.getConnection()

    const data = await db.raw(`
        select
          CODIGOORGCONC,
          CODIGOLINHA,
          NROFICIALLINHA,
          NOMELINHA
        from
          bgm_cadlinhas
        where
          CODIGOEMPRESA = ${idEmpresa} AND
          CODIGOORGCONC is not null
        order by
          CODIGOLINHA
    `)

    for await (const linhaGlobus of data) {
      const linhaGlobusExists = await GlobusLinha.findByCodigoAndFilial(
        linhaGlobus.CODIGOLINHA,
        linhaGlobus.CODIGOORGCONC,
      )

      if (!linhaGlobusExists) {
        await GlobusLinha.create({
          id_empresa: idEmpresa,
          codigo_filial: linhaGlobus.CODIGOORGCONC,
          codigo_linha: linhaGlobus.CODIGOLINHA,
          nome_linha: linhaGlobus.NOMELINHA,
          numero_oficial_linha: linhaGlobus.NROFICIALLINHA,
        })
      } else {
        await GlobusLinha.update(linhaGlobusExists.id, {
          id_empresa: idEmpresa,
          codigo_filial: linhaGlobus.CODIGOORGCONC,
          codigo_linha: linhaGlobus.CODIGOLINHA,
          nome_linha: linhaGlobus.NOMELINHA,
          numero_oficial_linha: linhaGlobus.NROFICIALLINHA,
          updated_at: new Date(),
        })
      }
    }

    console.log("syncLinhasGlobus: fim")
  } catch (error) {
    console.error(error)
  }
}

const syncFuncionariosGlobus = async () => {
  try {
    const idEmpresa = 4
    const db = DbOracle.getConnection()

    const data = await db.raw(`
      select
        f.codintfunc,
        f.chapafunc,
        f.nomefunc,
        f.codfunc,
        f.apelidofunc
      from
        flp_funcionarios f
      where
        f.CODIGOEMPRESA = ${idEmpresa} and
        f.SITUACAOFUNC = 'A'
    `)

    const motoristas = await Driver.getAll()

    for (const funcionarioGlobus of data) {
      const findMotorista = motoristas.find(
        (item) =>
          item.employeeNumber ===
          Number.parseInt(funcionarioGlobus.CHAPAFUNC, 10),
      )

      const funcionarioGlobusExists = await GlobusFuncionario.findByChapa(
        funcionarioGlobus.CHAPAFUNC,
      )

      if (!funcionarioGlobusExists) {
        await GlobusFuncionario.create({
          id_empresa: idEmpresa,
          codigo: funcionarioGlobus.CODFUNC,
          codigo_funcionario: funcionarioGlobus.CODINTFUNC,
          apelido: funcionarioGlobus.APELIDOFUNC,
          chapa: funcionarioGlobus.CHAPAFUNC,
          driverId: findMotorista
            ? findMotorista.driverId.toString()
            : undefined,
          nome: funcionarioGlobus.NOMEFUNC,
        })
      } else {
        await GlobusFuncionario.update(funcionarioGlobusExists.id, {
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
        })
      }
    }

    console.log("syncFuncionariosGlobus: fim")
  } catch (error) {
    console.error(error)
  }
}
// execute()
// syncCarrosGlobus()
// syncLinhasGlobus()
syncFuncionariosGlobus()
