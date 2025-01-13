import Empresa from "../../models/Empresa"

type Params = {
  id: number
}

const execute = async ({ id }: Params) => {
  return await Empresa.getById(id)
}

export default execute
