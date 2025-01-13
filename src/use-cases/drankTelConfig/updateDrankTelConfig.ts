import DrankTelConfig from "../../models/DrankTelConfig"

type Params = {
  name: string
  value: string
}

const execute = async ({ name, value }: Params) => {
  return await DrankTelConfig.updateValueByName({
    name,
    value,
  })
}

export default execute
