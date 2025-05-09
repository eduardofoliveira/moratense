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

execute()
