import knex, { Knex } from "knex"

const config = {
  production: {},
  development: {},
}

// (ADDRESS_LIST =
//   (ADDRESS = (PROTOCOL = TCP)(HOST = ${process.env.ORCL_HOST})(PORT = ${process.env.ORCL_PORT}))
// )

const testConnString = `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${process.env.ORCL_HOST})(PORT=${process.env.ORCL_PORT}))(CONNECT_DATA=(SID=${process.env.ORCL_SID})))`

console.log(testConnString)
console.log({
  connection: {
    user: process.env.ORCL_USER,
    password: process.env.ORCL_PASS,
    // database: process.env.ORCL_SID,
    connectString: testConnString,
  },
})

config.production = {
  client: "oracledb",
  connection: {
    user: process.env.ORCL_USER,
    password: process.env.ORCL_PASS,
    debugger: true,
    debug: true,
    // database: process.env.ORCL_SID,
    connectString: testConnString,
    // connectString: `${process.env.ORCL_HOST}:${process.env.ORCL_PORT}`,
  },
}
config.development = {
  client: "oracledb",
  connection: {
    user: process.env.ORCL_USER,
    password: process.env.ORCL_PASS,
    debugger: true,
    debug: true,
    connectString: testConnString,
    // connectString: `${process.env.ORCL_HOST}:${process.env.ORCL_PORT}`,
  },
}

const getConfig = () => {
  if (process.env.ENVIRONMENT === "production") {
    return config.production
  }
  return config.development
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class ConnectionManager {
  private static instance: Knex
  private static reconnecting = false
  private static reconnectAttempts = 0
  private static maxReconnectAttempts = 5
  private static reconnectInterval = 5000 // 5 segundos

  // Singleton para manter a conexão única
  public static getConnection(): Knex {
    if (!ConnectionManager.instance) {
      ConnectionManager.createConnection()
    }
    return ConnectionManager.instance
  }

  // Cria a conexão inicial ou recriada
  private static createConnection(): void {
    ConnectionManager.instance = knex(getConfig())

    // Escutar erros na conexão
    // ConnectionManager.instance.raw("SELECT 1").catch((err) => {
    //   console.error("Initial database connection failed:", err)
    //   ConnectionManager.attemptReconnect()
    // })

    // Escuta erros para tentar reconectar
    ConnectionManager.instance.on("query-error", (err) => {
      console.error("Query error detected:", err)
      if (
        err.code === "ECONNRESET" ||
        err.code === "PROTOCOL_CONNECTION_LOST"
      ) {
        if (!ConnectionManager.reconnecting) {
          ConnectionManager.attemptReconnect()
        }
      }
    })
  }

  // Recriar conexão no caso de erro crítico
  private static attemptReconnect(): void {
    if (
      ConnectionManager.reconnecting ||
      ConnectionManager.reconnectAttempts >=
        ConnectionManager.maxReconnectAttempts
    ) {
      console.error("Max reconnect attempts reached or already reconnecting.")
      return
    }

    ConnectionManager.reconnecting = true
    ConnectionManager.reconnectAttempts++

    setTimeout(() => {
      console.warn(
        `Attempting to reconnect... (${ConnectionManager.reconnectAttempts}/${ConnectionManager.maxReconnectAttempts})`,
      )
      try {
        ConnectionManager.createConnection()
        ConnectionManager.reconnecting = false
        ConnectionManager.reconnectAttempts = 0
        console.log("Reconnected to the database successfully.")
      } catch (err) {
        console.error("Reconnection attempt failed:", err)
        ConnectionManager.reconnecting = false
        if (
          ConnectionManager.reconnectAttempts <
          ConnectionManager.maxReconnectAttempts
        ) {
          ConnectionManager.attemptReconnect()
        }
      }
    }, ConnectionManager.reconnectInterval)
  }
}

export default ConnectionManager
