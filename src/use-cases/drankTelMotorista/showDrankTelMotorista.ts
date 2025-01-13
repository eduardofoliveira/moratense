import DrankTelMotoristas from "../../models/DrankTelMotoristas"

type Input = {
  codigo_mix: string
}

const execute = async ({ codigo_mix }: Input) => {
  return await DrankTelMotoristas.findByMixCode(codigo_mix)
}

export default execute
