import TelemetriaMotorista from "../../models/TelemetriaMotorista"

type Params = {
  id_empresa: number
  codigo: string
  nome: string
  codigo_motorista: number
  data_cadastro: Date
}

const execute = async (id: string, id_empresa: number, motorista: Params) => {
  return await TelemetriaMotorista.update(id, id_empresa, motorista)
}

export default execute
