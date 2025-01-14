import "dotenv/config"

import Db from "./database/connectionManager"

const executar = async () => {
  const conn = Db.getConnection()

  const [result] = await conn.raw(`
    SELECT
      dv.id,
      tm.codigo_motorista,
      dv.motorista_cod,
      tm.nome
    FROM
      drank_tel_viagens dv,
      aux_viagens av,
      telemetria_motoristas tm
    WHERE
      dv.id = av.id_drank_tel_viagens and
      dv.motorista_cod != tm.codigo_motorista and
      tm.codigo = av.driver_id
  `)

  result.map((item: any) => {
    console.log(
      `UPDATE drank_tel_viagens SET motorista_cod = ${item.codigo_motorista}, motorista_nome = '${item.nome}'  WHERE id = ${item.id};`,
    )
  })

  await conn.destroy()
}

executar()
