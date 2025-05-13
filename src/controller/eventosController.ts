import type { Request, Response } from "express"
import { format, parseISO, subDays } from "date-fns"

import showAuxEvento from "../use-cases/auxEvento/showAuxEvento"
import showTelemetriaCarro from "../use-cases/telemetriaCarro/showTelemetriaCarro"
import showDrankTelMotorista from "../use-cases/drankTelMotorista/showDrankTelMotorista"
import insertDrankTelEvento from "../use-cases/drankTelEvento/insertDrankTelEvento"
import insertAuxEvento from "../use-cases/auxEvento/insertAuxEvento"
import showTelemetriaTiposEventoConverter from "../use-cases/telemetriaTipoEventoConverter/showTelemetriaTiposEventoConverter"
import showTelemetriaTiposEvento from "../use-cases/telemetriaTiposEvento/showTelemetriaTiposEvento"
import showEmpresa from "../use-cases/empresa/showEmpresa"

import { insertEvents } from "../homelab"

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
  const { eventos } = req.body

  await insertEvents(eventos)

  const empresa = await showEmpresa({ id: 4 })

  const eventosDb = await showTelemetriaTiposEvento({
    id_empresa: 4,
  })

  const eventosConverter = await showTelemetriaTiposEventoConverter({
    id_empresa: 4,
  })

  let count = 0
  for (const evento of eventos) {
    try {
      console.log(`Eventos: ${count++}`)

      const eventoExistDB = await showAuxEvento({
        tripId: evento.EventId.toString(),
      })

      if (eventoExistDB) {
        continue
      }

      const carro = await showTelemetriaCarro({
        codigo_mix: evento.AssetId.toString(),
      })

      const motorista = await showDrankTelMotorista({
        codigo_mix: evento.DriverId.toString(),
      })

      const idTipoConverter = eventosConverter.find(
        (item) => item.id_mix_entrada === evento.EventTypeId.toString(),
      )

      const findEventoDB = eventosDb.find(
        (item) => item.codigo === evento.EventTypeId.toString(),
      )

      let long = ""
      let lat = ""

      if (evento.StartPosition) {
        long = evento?.StartPosition?.Longitude.toString()
        lat = evento?.StartPosition?.Latitude.toString()
      }

      let id_tipo = 0
      if (idTipoConverter) {
        id_tipo = idTipoConverter.id_tipo_saida
      }
      if (id_tipo === 0 && findEventoDB && findEventoDB.id_tipo_original) {
        id_tipo = findEventoDB.id_tipo_original as number
      }
      if (id_tipo === 0 && findEventoDB) {
        id_tipo = findEventoDB.id as number
      }

      const insert = {
        id_empresa: empresa.id as number,
        carro: carro.carro,
        id_carro_tel: carro.id as number,
        id_motorista: motorista ? (motorista.codigo_motorista as number) : 0,
        data_ini: evento.StartDateTime
          ? new Date(evento.StartDateTime)
          : "0000-00-00 00:00:00",
        data_fim:
          evento.TotalTimeSeconds > 0
            ? new Date(evento.EndDateTime)
            : "0000-00-00 00:00:00",
        id_tipo,
        tempo: evento.TotalTimeSeconds,
        quantidades_ocorrencias: evento.TotalOccurances
          ? evento.TotalOccurances
          : 1,
        data_turno_tel: converteDataParaTurno(evento.StartDateTime),
        valor_evento: evento?.Value?.toString() ? evento.Value.toString() : 0,
        data: new Date(),
        long,
        lat,
        id_endereco: 0,
      }

      const id = await insertDrankTelEvento(insert)

      await insertAuxEvento({
        asset_id: evento.AssetId.toString(),
        driver_id: evento.DriverId.toString(),
        event_id: evento.EventId.toString(),
        event_type_id: evento.EventTypeId.toString(),
        id_drank_tel_eventos: id,
      })
    } catch (error) {
      console.error(error)
    }
  }

  return res.send({ message: "Dados inseridos com sucesso" })
}

export default {
  batchInsert,
}
