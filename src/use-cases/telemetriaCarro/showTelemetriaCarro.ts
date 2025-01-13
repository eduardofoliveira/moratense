import TelemetriaCarro from "../../models/TelemetriaCarro"

type Input = {
  codigo_mix: number
}

const execute = async ({ codigo_mix }: Input) => {
  return await TelemetriaCarro.findByMixCode(codigo_mix)
}

export default execute
