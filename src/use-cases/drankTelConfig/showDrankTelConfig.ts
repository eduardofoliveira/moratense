import DrankTelConfig from "../../models/DrankTelConfig"

type Params = {
  name: string
}

const execute = async ({ name }: Params) => {
  return await DrankTelConfig.findByName(name)
}

export default execute
