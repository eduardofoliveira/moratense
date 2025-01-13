import TelemetriaCarro from "../../models/TelemetriaCarro"

const execute = async () => {
  return await TelemetriaCarro.getAll()
}

export default execute
