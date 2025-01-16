import "dotenv/config"

import Db from "./database/connectionManager"

const executar = async () => {
  const conn = Db.getConnection()

  const [result] = await conn.raw(`
    SELECT
			a.id_drank_tel_eventos
		FROM
			aux_eventos a
		where
			a.event_type_id IN (-3021016551627388635, -8571486384802428876)
		ORDER BY
			created_at DESC
  `)

  let count = 0

  for await (const item of result) {
    console.log(`Evento: ${count++}`)

    conn.raw(`
      UPDATE
        teleconsult.drank_tel_eventos de
      SET
        de.id_tipo = 1295
      where
        de.id = ${item.id_drank_tel_eventos}
    `)

    conn.raw(`
      UPDATE
        teleconsult_api.drank_tel_eventos de
      SET
        de.id_tipo = 1295
      where
        de.id = ${item.id_drank_tel_eventos}
    `)

    await conn.raw(`
      UPDATE
        teleconsult_app.drank_tel_eventos de
      SET
        de.id_tipo = 1295
      where
        de.id = ${item.id_drank_tel_eventos}
    `)
  }

  await conn.destroy()
}

executar()
