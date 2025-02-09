import "dotenv/config"
import fs from "node:fs/promises"

import DbOracle from "./database/connectionManagerOracle"
import GlobusCarro from "./models/GlobusCarro"

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
  try {
    const db = DbOracle.getConnection()

    const data = await db.raw(`
        select
          codigoveic,
          CODIGOTPFROTA,
          placaatualveic,
          prefixoveic,
          condicaoveic
        from
          FRT_CADVEICULOS
        where
          CODIGOEMPRESA = 4
        order by
          PREFIXOVEIC
    `)

    console.log(data)
  } catch (error) {
    console.error(error)
  }
}

// execute()
syncCarrosGlobus()
