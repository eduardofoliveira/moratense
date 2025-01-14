import AuxPosition from "../../models/AuxPosition"

type Input = {
  positionId: number
}

const execute = async ({ positionId }: Input) => {
  return await AuxPosition.getByPositionId(positionId)
}

export default execute
