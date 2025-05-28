import type { Request, Response } from "express"

import Db from "../database/connectionManagerDev"

const listarEventosConsumo = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { id_empresa } = req.query

    const db = Db.getConnection()

    const [eventosConsumo] = await db.raw(`
      SELECT
        ec.code,
        ec.descricao_exibida
      FROM
        eventtype et,
        events_converter ec
      WHERE
        et.eventTypeId = ec.eventTypeId and
        et.carregar = 1 and
        et.consumo = 1 and
        et.id_empresa = ${id_empresa}
      ORDER BY
        description
    `)

    return res.json(eventosConsumo)
  } catch (error) {
    console.error("Erro ao listar eventos de consumo:", error)
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
}

const listarEventosSeguranca = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { id_empresa } = req.query

    const db = Db.getConnection()

    const [eventosConsumo] = await db.raw(`
      SELECT
        ec.code,
        ec.descricao_exibida
      FROM
        eventtype et,
        events_converter ec
      WHERE
        et.eventTypeId = ec.eventTypeId and
        et.carregar = 1 and
        et.seguranca = 1 and
        et.id_empresa = ${id_empresa}
      ORDER BY
        description
    `)

    return res.json(eventosConsumo)
  } catch (error) {
    console.error("Erro ao listar eventos de consumo:", error)
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
}

export default {
  listarEventosConsumo,
  listarEventosSeguranca,
}
