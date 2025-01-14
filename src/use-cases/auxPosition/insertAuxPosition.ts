import AuxPosition from "../../models/AuxPosition"

type Params = {
  id_drank_tel_viagens_pontos: number
  asset_id: string
  driver_id: string
  position_id: string
}

const execute = async (viagem: Params) => {
  return await AuxPosition.create(viagem)
}

export default execute
