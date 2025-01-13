import DrankTelEvento from "../../models/DrankTelEvento"

type Params = {
  id_empresa: number
  carro: number
  id_carro_tel: number
  id_motorista: number
  data_ini: Date | string
  data_fim: Date | string
  id_tipo: number
  tempo: number
  quantidades_ocorrencias: number
  data_turno_tel: Date | string
  data: Date
  long: string
  lat: string
  codigo_motorista_gb?: number
  codigo_motorista_db_teste?: number
  id_endereco?: number
}

const execute = async (evento: Params) => {
  return await DrankTelEvento.create(evento)
}

export default execute
