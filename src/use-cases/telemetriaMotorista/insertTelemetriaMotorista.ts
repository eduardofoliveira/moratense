import TelemetriaMotorista from "../../models/TelemetriaMotorista"

type Params = {
  id_empresa: number
  codigo: string
  nome: string
  codigo_motorista: number
  data_cadastro: Date
}

const execute = async (viagem: Params) => {
  return await TelemetriaMotorista.create(viagem)
}

export default execute
