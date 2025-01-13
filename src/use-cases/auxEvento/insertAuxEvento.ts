import AuxEventos from "../../models/AuxEventos"

type Params = {
  id_drank_tel_eventos: number
  asset_id: string
  driver_id: string
  event_id: number
  event_type_id: number
}

const execute = async (viagem: Params) => {
  return await AuxEventos.create(viagem)
}

export default execute
