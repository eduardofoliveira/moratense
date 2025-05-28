import type { Request, Response } from "express"

import Db from "../database/connectionManagerDev"

const listarMotoristas = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id_empresa } = req.query

    const db = Db.getConnection()

    const [listaMotoristas] = await db.raw(`
      SELECT
        id,
        employeeNumber,
        name
      FROM
        drivers
      WHERE
        employeeNumber > 0 and
        id_empresa = ${id_empresa}
      ORDER BY
        NAME asc
    `)

    return res.json(listaMotoristas)
  } catch (error) {
    console.error("Erro ao listar eventos de consumo:", error)
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
}

export default {
  listarMotoristas,
}
