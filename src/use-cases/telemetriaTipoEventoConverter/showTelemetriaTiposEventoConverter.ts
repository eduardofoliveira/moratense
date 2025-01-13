import TelemetriaTiposEventoConverter from "../../models/TelemetriaTiposEventoConverter"

type Input = {
  id_empresa: number
}

const execute = async ({ id_empresa }: Input) => {
  return await TelemetriaTiposEventoConverter.getByIdEmpresa({ id_empresa })
}

export default execute
