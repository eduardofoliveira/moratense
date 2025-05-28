import type { Request, Response } from "express"

import Db from "../database/connectionManagerDev"

const listarVeiculos = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id_empresa } = req.query

    const db = Db.getConnection()

    const [listaVeiculos] = await db.raw(`
      SELECT
        id,
        description,
        assetId
      FROM
        assets
      WHERE
        id_empresa = ${id_empresa}
      ORDER BY
        description
    `)

    return res.json(listaVeiculos)
  } catch (error) {
    console.error("Erro ao listar eventos de consumo:", error)
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
}

export default {
  listarVeiculos,
}
