import DrankTelViagensPontos from "../../models/DrankTelViagensPontos"

type Params = {
  id_empresa: number
  long: number
  lat: number
  km: number
  carro: number
  data: Date
  data_turno: Date | string
  data_cadastro: Date
}

const execute = async (viagem: Params) => {
  return await DrankTelViagensPontos.create(viagem)
}

export default execute
