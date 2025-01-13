import TelemetriaCarro from "../../models/TelemetriaCarro"

type InputAsset = {
  CreatedDate: string
  IsConnectedTrailer: boolean
  AssetTypeId: number
  SiteId: number
  AssetId: number
  IsDefaultImage: boolean
  EngineHours?: string
  Odometer?: number
  FmVehicleId: number
  DefaultDriverId: number
  Country?: string
  CreatedBy: string
  UserState: string
  AssetImageUrl: string
  AssetImage: string
  IconColour: string
  Icon: string
  VinNumber?: string
  Year?: string
  Model?: string
  Make: string
  TargetHourlyFuelConsumptionUnits: string
  TargetFuelConsumptionUnits: string
  FuelType?: string
  RegistrationNumber: string
  Description: string
}

const execute = async ({
  input,
  idEmpresa,
}: { input: InputAsset[]; idEmpresa: number }) => {
  console.log("Iniciando sincronização de carros...")

  for (const asset of input) {
    const exists = await TelemetriaCarro.findByMixCode(asset.AssetId)

    if (!exists) {
      const carro = Number.parseInt(asset.Description, 10)
      if (Number.isInteger(carro)) {
        await TelemetriaCarro.create({
          carro: Number.parseInt(asset.Description, 10),
          codigo_mix: asset.AssetId.toString(),
          id_empresa: idEmpresa,
          data_cadastro: new Date(),
        })
      }
    }
  }
  console.log("Finalizado sincronização de carros...")
}

export default execute
