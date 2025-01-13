import Empresa from "../../models/Empresa"

const execute = async () => {
  return await Empresa.getAll()
}

export default execute
