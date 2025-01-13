import AuxEventos from "../../models/AuxEventos"

type Input = {
  tripId: number
}

const execute = async ({ tripId }: Input) => {
  return await AuxEventos.getByEventId(tripId)
}

export default execute
