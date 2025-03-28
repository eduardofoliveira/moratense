import "dotenv/config"

import ApiMix from "./service/api.mix"
import showEmpresa from "./use-cases/empresa/showEmpresa"
import indexTelemetriaMotorista from "./use-cases/telemetriaMotorista/indexTelemetriaMotorista"
import insertTelemetriaMotorista from "./use-cases/telemetriaMotorista/insertTelemetriaMotorista"
import updateTelemetriaMotorista from "./use-cases/telemetriaMotorista/updateTelemetriaMotorista"
import updateDrankTelMotoristaByCodMix from "./use-cases/drankTelMotorista/updateDrankTelMotoristaByCodMix"
import showDrankTelMotorista from "./use-cases/drankTelMotorista/showDrankTelMotorista"
import insertDrankTelMotorista from "./use-cases/drankTelMotorista/insertDrankTelMotorista"

const executar = async () => {
  try {
    const empresa = await showEmpresa({ id: 4 })
    const apiMix = await ApiMix.getInstance()
    // await apiMix.getToken()

    const motoristasDb = await indexTelemetriaMotorista()

    const motoristas = await apiMix.listaMotoristas({
      groupId: empresa.mix_groupId,
    })

    console.log(`Total: ${motoristas.length}`)
    let count = 0

    for await (const motorista of motoristas) {
      console.log(`Motorista: ${count++}`)
      console.log(`Motorista: ${motorista.Name}`)

      const motoristaExistDrank = await showDrankTelMotorista({
        codigo_mix: motorista.DriverId.toString(),
      })

      if (!motoristaExistDrank) {
        console.log(`Inserindo Motorista ${motorista.Name} no Drank`)
        if (Number.parseInt(motorista.EmployeeNumber, 10) > 0) {
          await insertDrankTelMotorista({
            codigo: motorista.DriverId.toString(),
            codigo_motorista: Number.parseInt(motorista.EmployeeNumber, 10),
            data_cadastro: new Date(),
            id_empresa: empresa.id as number,
            nome: motorista.Name,
          })
        }
      }

      if (motoristaExistDrank) {
        // console.log("Motorista existe no Drank")
        if (Number.parseInt(motorista.EmployeeNumber, 10) > 0) {
          await updateDrankTelMotoristaByCodMix({
            codigo_mix: motorista.DriverId.toString(),
            codigo_motorista: Number.parseInt(motorista.EmployeeNumber, 10),
            id_empresa: empresa.id as number,
            nome: motorista.Name,
          })
        }
      }

      const exists = motoristasDb.find(
        (item) => BigInt(item.codigo) === BigInt(motorista.DriverId),
      )

      if (!exists) {
        console.log(`Inserindo Motorista ${motorista.Name} no Telemetria`)
        if (Number.parseInt(motorista.EmployeeNumber, 10) > 0) {
          await insertTelemetriaMotorista({
            codigo: motorista.DriverId.toString(),
            id_empresa: empresa.id as number,
            codigo_motorista: Number.parseInt(motorista.EmployeeNumber, 10),
            nome: motorista.Name,
            data_cadastro: new Date(),
          })
        }
      }

      if (exists) {
        if (Number.parseInt(motorista.EmployeeNumber, 10) > 0) {
          updateTelemetriaMotorista(
            motorista.DriverId.toString(),
            empresa.id as number,
            {
              codigo: motorista.DriverId.toString(),
              codigo_motorista: Number.parseInt(motorista.EmployeeNumber, 10),
              data_cadastro: new Date(),
              id_empresa: empresa.id as number,
              nome: motorista.Name,
            },
          )
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
}

executar()
