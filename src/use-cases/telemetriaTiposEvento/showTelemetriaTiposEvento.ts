import TelemetriaTiposEvento from "../../models/TelemetriaTiposEvento"

type Input = {
  id_empresa: number
}

const execute = async ({ id_empresa }: Input) => {
  return await TelemetriaTiposEvento.getByIdEmpresa({ id_empresa })
}

export default execute
