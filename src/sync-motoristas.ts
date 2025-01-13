import "dotenv/config"

import ApiMix from "./service/api.mix"
import showEmpresa from "./use-cases/empresa/showEmpresa"
import indexTelemetriaMotorista from "./use-cases/telemetriaMotorista/indexTelemetriaMotorista"
import insertTelemetriaMotorista from "./use-cases/telemetriaMotorista/insertTelemetriaMotorista"

const executar = async () => {
  const empresa = await showEmpresa({ id: 4 })

  const apiMix = ApiMix.getInstance()
  await apiMix.getToken()

  const motoristasDb = await indexTelemetriaMotorista()

  const motoristas = await apiMix.listaMotoristas({
    groupId: empresa.mix_groupId,
  })

  console.log(`Total: ${motoristas.length}`)
  let count = 0

  for await (const motorista of motoristas) {
    console.log(`Motorista: ${count++}`)

    const exists = motoristasDb.find(
      (item) => BigInt(item.codigo) === BigInt(motorista.DriverId),
    )

    if (!exists) {
      console.log("Motorista não encontrado, inserindo...")

      if (
        motorista.EmployeeNumber &&
        Number.parseInt(motorista.EmployeeNumber, 10)
      ) {
        console.log({
          codigo: motorista.DriverId.toString(),
          id_empresa: empresa.id as number,
          codigo_motorista: motorista.EmployeeNumber,
          nome: motorista.Name,
          data_cadastro: new Date(),
        })

        await insertTelemetriaMotorista({
          codigo: motorista.DriverId.toString(),
          id_empresa: empresa.id as number,
          codigo_motorista: Number.parseInt(motorista.EmployeeNumber, 10),
          nome: motorista.Name,
          data_cadastro: new Date(),
        })
      }
    }
  }
}

setTimeout(() => {
  executar()
}, 60000)

executar()
