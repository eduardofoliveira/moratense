import type { Request, Response } from "express"
import { format, parseISO, subDays } from "date-fns"

import showAuxPosition from "../use-cases/auxPosition/showAuxPosition"
import showTelemetriaCarro from "../use-cases/telemetriaCarro/showTelemetriaCarro"
import insertDrankTelViagemPonto from "../use-cases/drankTelViagensPonto/insertDrankTelViagemPonto"
import insertAuxPosition from "../use-cases/auxPosition/insertAuxPosition"
import showEmpresa from "../use-cases/empresa/showEmpresa"

import { insertPositions } from "../homelab"

function converteDataParaTurno(data: string) {
  const dataObj = new Date(data)
  let dt = format(dataObj, "yyyy-MM-dd")

  const hora = dataObj.getHours()
  const minutos = dataObj.getMinutes()
  const segundos = dataObj.getSeconds()

  if (hora < 2 && minutos < 59 && segundos < 59) {
    dt = format(subDays(parseISO(dt), 1), "yyyy-MM-dd")
  }

  return dt
}

const batchInsert = async (req: Request, res: Response): Promise<any> => {
  const { posicoes } = req.body

  await insertPositions(posicoes)

  const empresa = await showEmpresa({ id: 4 })

  let count = 0
  for await (const posicao of posicoes) {
    try {
      console.log(`Pontos: ${count++}`)

      const carro = await showTelemetriaCarro({
        codigo_mix: posicao.AssetId.toString(),
      })

      const positionExistDB = await showAuxPosition({
        positionId: posicao.PositionId.toString(),
      })

      if (positionExistDB) {
        continue
      }

      const insert = {
        id_empresa: empresa.id as number,
        carro: carro.carro,
        km: posicao.SpeedKilometresPerHour,
        long: posicao.Longitude.toString(),
        lat: posicao.Latitude.toString(),
        data: new Date(posicao.Timestamp),
        data_turno: converteDataParaTurno(posicao.Timestamp),
        data_cadastro: new Date(),
      }

      const id = await insertDrankTelViagemPonto(insert)

      await insertAuxPosition({
        asset_id: posicao.AssetId.toString(),
        driver_id: posicao.DriverId.toString(),
        id_drank_tel_viagens_pontos: id,
        position_id: posicao.PositionId.toString(),
      })
    } catch (error) {
      console.log(error)
    }
  }

  return res.send({ message: "Dados inseridos com sucesso" })
}

export default {
  batchInsert,
}
