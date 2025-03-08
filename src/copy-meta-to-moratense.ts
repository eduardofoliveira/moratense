import "dotenv/config"

import DbTeleconsult from "./database/connectionManager"
import DbMoratense from "./database/connectionManagerHomeLab"

const execute = async () => {
  const dbTeleconsult = DbTeleconsult.getConnection()
  const dbMoratense = DbMoratense.getConnection()

  const [result] = await dbTeleconsult.raw(`
    SELECT
      m.*,
      c.codigo AS chassi,
      l.codigo AS codigo_linha,
      l.nome AS nome_linha,
      l.filial_linha AS filial_linha
    FROM
      telemetria_metas m,
      linhas l,
      chassis c
    WHERE
      m.id_empresa = 4 and
      m.id_linha = l.id and
      m.id_chassi = c.id
    ORDER BY
      m.id_linha,
      m.id_chassi
  `)

  for await (const row of result) {
    const {
      id_empresa,
      chassi,
      codigo_linha,
      filial_linha,
      meta,
      supermeta,
      p_meta,
      p_supermeta,
      media_antes,
    } = row

    const [[chassiExists]] = await dbMoratense.raw(`
      SELECT
        *
      FROM
        chassi
      WHERE
        numero_chassi = ${chassi}
      ORDER BY
        id ASC
      LIMIT 1
    `)

    const [[linhaExists]] = await dbMoratense.raw(`
      SELECT
        *
      FROM
        globus_linha
      WHERE
        codigo_linha = ${codigo_linha} and
        codigo_filial = ${filial_linha}
      ORDER BY
        id ASC
      LIMIT 1
    `)

    if (chassiExists && linhaExists) {
      await dbMoratense.raw(`
        INSERT INTO
          metas
        (
          id_empresa,
          fk_id_chassi,
          fk_id_globus_linha,
          meta,
          supermeta,
          premiacao_meta,
          premiacao_supermeta,
          media_anterior
        )
        VALUES
        (
          ${id_empresa},
          ${chassiExists.id},
          ${linhaExists.id},
          ${meta},
          ${supermeta},
          ${p_meta},
          ${p_supermeta},
          ${media_antes}
        )
      `)
    } else {
      console.log(`Chassi ${chassi} ou Linha ${codigo_linha} não encontrados`)
      console.log(row)
    }
  }

  process.exit(0)
}

execute()
