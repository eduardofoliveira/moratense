import DrankTelMotoristas from "../../models/DrankTelMotoristas"

type Input = {
  id_empresa: number
  codigo: string
  nome: string
  codigo_motorista: number
  data_cadastro: Date
}

const execute = async (data: Input) => {
  return await DrankTelMotoristas.create(data)
}

export default execute
