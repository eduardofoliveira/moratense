import "dotenv/config"
import { addDays, parse, format, subDays } from "date-fns"

import Db from "./database/connectionManager"

const executar = async () => {
  let dataInicial = parse(
    format(subDays(new Date(), 2), "yyyy-MM-dd"),
    "yyyy-MM-dd",
    new Date(),
  )
  const dataTermino = parse(
    format(addDays(new Date(), 1), "yyyy-MM-dd"),
    "yyyy-MM-dd",
    new Date(),
  )

  const knex = Db.getConnection()
  while (
    format(dataInicial, "yyyy-MM-dd") !== format(dataTermino, "yyyy-MM-dd")
  ) {
    console.log(
      `Processando: ${format(dataInicial, "yyyy-MM-dd")} 03:00:00' AND '${format(addDays(dataInicial, 1), "yyyy-MM-dd")} 02:59:59`,
    )

    const [result] = await knex.raw(`
        SELECT
          DT,
          COUNT(*) AS quantidade
        FROM
          carros_viagens_processado
        WHERE
          DT between '${format(dataInicial, "yyyy-MM-dd")}' AND '${format(dataInicial, "yyyy-MM-dd")}'
        GROUP BY
          DT
    `)

    if (result.length === 0 || result[0].quantidade < 30) {
      console.log("Processar DIA: ", format(dataInicial, "yyyy-MM-dd"))

      await knex.raw(`
        INSERT INTO carros_viagens_processado (PREFIXOVEIC, DT, CODIGOLINHA, NOMELINHA, F1COD, F1AP, DTI, DTF, CDFT, filial)
        SELECT carro                   PREFIXOVEIC,
              data_turno              DT,
              linha                   CODIGOLINHA,
              linhas.nome             NOMELINHA,
              codigo_colaborador      F1COD,
              colaboradores.nome      F1AP,
              Min(data_saida_garagem) DTI,
              Max(data_recolhido)     DTF,
              codigo_frota            CDFT,
              carros_viagens.filial
        FROM   carros_viagens_teste carros_viagens
              LEFT JOIN linhas
                      ON linhas.codigo = carros_viagens.linha
                        AND linhas.id_empresa = 4
              LEFT JOIN colaboradores
                      ON colaboradores.codigo = carros_viagens.codigo_colaborador
                        AND colaboradores.id_empresa = 4
              LEFT JOIN carros
                      ON carros.codigo = carros_viagens.carro
                        AND carros.id_empresa = 4
        WHERE  carros.removido = 0
              AND data_saida_garagem BETWEEN
                  '${format(dataInicial, "yyyy-MM-dd")} 03:00:00' AND '${format(addDays(dataInicial, 1), "yyyy-MM-dd")} 02:59:59'
              AND carros_viagens.id_empresa = 4
              AND carros.codigo IS NOT NULL
        GROUP  BY carros_viagens.carro,
                  carros_viagens.data_turno,
                  carros_viagens.linha,
                  carros_viagens.codigo_colaborador
      `)
    }

    dataInicial = addDays(dataInicial, 1)
  }
  await knex.destroy()

  process.exit(0)
}

executar()
