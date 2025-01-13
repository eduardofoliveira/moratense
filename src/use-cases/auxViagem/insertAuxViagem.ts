import AuxViagens from "../../models/AuxViagens"

type Params = {
  id_drank_tel_viagens: number
  asset_id: string
  driver_id: string
  trip_id: number
}

const execute = async (viagem: Params) => {
  return await AuxViagens.create(viagem)
}

export default execute
