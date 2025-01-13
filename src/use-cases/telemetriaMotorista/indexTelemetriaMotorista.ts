import TelemetriaMotorista from "../../models/TelemetriaMotorista"

const execute = async () => {
  return await TelemetriaMotorista.getAll()
}

export default execute
