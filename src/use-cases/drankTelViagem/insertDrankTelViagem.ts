import DrankTelViagens from "../../models/DrankTelViagens"

type Params = {
  id_empresa: number
  carro: number
  id_carro_tel: number
  motorista_cod: number
  motorista_nome: string
  data_ini: Date
  data_fim: Date
  km: number
  combustivel: number
  motor_ini?: number
  motor_fim?: number
  motor_tempo: number
  max_kmh: number
  subviagem: number
  long: number
  lat: number
  data: Date
}

const execute = async (viagem: Params) => {
  return await DrankTelViagens.create(viagem)
}

export default execute
