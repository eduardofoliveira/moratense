import DrankTelMotoristas from "../../models/DrankTelMotoristas"

type Input = {
  codigo_mix: string
  codigo_motorista: number
  nome: string
  id_empresa: number
}

const execute = async (data: Input) => {
  return await DrankTelMotoristas.updateByMixCode(data)
}

export default execute
