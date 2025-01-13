import AuxViagens from "../../models/AuxViagens"

type Input = {
  tripId: number
}

const execute = async ({ tripId }: Input) => {
  return await AuxViagens.getByTripId(tripId)
}

export default execute
