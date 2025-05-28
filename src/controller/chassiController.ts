import type { Request, Response } from "express"

import Db from "../database/connectionManagerDev"

const listarChassi = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id_empresa } = req.query

    const db = Db.getConnection()

    const [listaChassi] = await db.raw(`
      SELECT
        id,
        numero_chassi,
        text_chassi
      FROM
        chassi c
      WHERE
        id_empresa = ${id_empresa}
      ORDER BY
        numero_chassi,
        text_chassi
    `)

    return res.json(listaChassi)
  } catch (error) {
    console.error("Erro ao listar eventos de consumo:", error)
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
}

export default {
  listarChassi,
}
