import "dotenv/config"

import DbDev from "./database/connectionManagerDev"
import DbProd from "./database/connectionManagerHomeLab"

const execute = async () => {
  const devConnection = DbDev.getConnection()
  const prodConnection = DbProd.getConnection()

  const pageSize = 50000 // Número máximo de registros por página

  // Get all tables from the production database
  // const [tables] = await prodConnection.raw("SHOW TABLES")
  const tables = [["positions"]]

  for (const table of tables) {
    const tableName = Object.values(table)[0]

    // Check if the table exists in the development database
    const [tableExists] = await devConnection.raw(
      `SHOW TABLES LIKE '${tableName}'`,
    )

    if (tableExists.length === 0) {
      console.log(`Table ${tableName} does not exist in development. Skipping.`)
      continue
    }

    let offset = 0
    let hasMoreData = true

    while (hasMoreData) {
      // Get a page of data from the production table
      const [data] = await prodConnection.raw(
        `SELECT * FROM ${tableName} ORDER BY id LIMIT ${pageSize} OFFSET ${offset}`,
      )

      if (data.length === 0) {
        hasMoreData = false
        break
      }

      // Perform batch insert into the development table
      const insertQuery = devConnection(tableName)
        .insert(data)
        .onConflict("id") // Assuming "id" is the unique key
        .merge()

      await insertQuery

      console.log(
        `Page of data from ${tableName} (offset: ${offset}) synced to development.`,
      )

      offset += pageSize
    }

    console.log(`Data from ${tableName} fully synced to development.`)
  }

  console.log("Data sync completed.")
  process.exit(0)
}

// execute()

const deletePositions = async () => {
  const devConnection = DbDev.getConnection()

  const pageSize = 50000 // Número máximo de registros por página
  let offset = 0
  let hasMoreData = true

  while (hasMoreData) {
    // Get a page of data from the positions table
    const [data] = await devConnection.raw(
      `SELECT * FROM positions ORDER BY id LIMIT ${pageSize} OFFSET ${offset}`,
    )

    if (data.length === 0) {
      hasMoreData = false
      break
    }

    // Filter rows that are safe to delete
    const idsToDelete: number[] = []

    await Promise.all(
      data.map(async (row: any) => {
        const existsEvent = devConnection("events")
          .where("startPosition", row.positionId)
          .orWhere("endPosition", row.positionId)
          .first()

        const existsTripPosition = devConnection("trips")
          .where("endPositionId", row.positionId)
          .orWhere("startPositionId", row.positionId)
          .first()

        const [existsEventAwait, existsTripPositionAwait] = await Promise.all([
          existsEvent,
          existsTripPosition,
        ])

        if (!existsEventAwait && !existsTripPositionAwait) {
          idsToDelete.push(row.id)
        }
      }),
    )

    // Perform batch delete for all IDs in the current page
    if (idsToDelete.length > 0) {
      try {
        console.log(
          `Deleting ${idsToDelete.length} positions from development.`,
        )
        await devConnection("positions").whereIn("id", idsToDelete).del()
      } catch (error) {
        console.error("Erro ao deletar posições:", error)
      }
    }

    console.log(
      `Page of data from positions (offset: ${offset}) processed for deletion.`,
    )

    offset += pageSize
  }

  console.log("Deletion process completed.")
}

deletePositions()
