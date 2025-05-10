import knex, { Knex } from "knex"

const config = {
  production: {},
  development: {},
}

config.production = {
  client: "mysql2",
  connection: {
    host: process.env.MYSQL_HOST_DEV,
    user: process.env.MYSQL_USER_DEV,
    password: process.env.MYSQL_PASS_DEV,
    database: process.env.MYSQL_DATABASE_DEV,
    timezone: "-03:00",
    typeCast: (field: any, next: any) => {
      if (
        field.type === "DECIMAL" ||
        field.type === "BIGINT" ||
        field.type === "LONGLONG"
      ) {
        return field.string()
      }
      return next()
    },
  },
  pool: {
    min: 0,
    max: 5,
  },
}
config.development = {
  client: "mysql2",
  connection: {
    host: process.env.MYSQL_HOST_DEV,
    user: process.env.MYSQL_USER_DEV,
    password: process.env.MYSQL_PASS_DEV,
    database: process.env.MYSQL_DATABASE_DEV,
    timezone: "-03:00",
    typeCast: (field: any, next: any) => {
      if (
        field.type === "DECIMAL" ||
        field.type === "BIGINT" ||
        field.type === "LONGLONG"
      ) {
        return field.string()
      }
      return next()
    },
  },
  pool: {
    min: 0,
    max: 5,
  },
}

const getConfig = () => {
  if (process.env.ENVIRONMENT === "production") {
    return config.production
  }
  return config.development
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class connectionManagerHostgator {
  private static instance: Knex
  private static reconnecting = false
  private static reconnectAttempts = 0
  private static maxReconnectAttempts = 5
  private static reconnectInterval = 5000 // 5 segundos

  // Singleton para manter a conexão única
  public static getConnection(): Knex {
    if (!connectionManagerHostgator.instance) {
      connectionManagerHostgator.createConnection()
    }
    return connectionManagerHostgator.instance
  }

  // Cria a conexão inicial ou recriada
  private static createConnection(): void {
    connectionManagerHostgator.instance = knex(getConfig())

    // Escutar erros na conexão
    connectionManagerHostgator.instance.raw("SELECT 1").catch((err) => {
      console.error("Initial database connection failed:", err)
      connectionManagerHostgator.attemptReconnect()
    })

    // Escuta erros para tentar reconectar
    connectionManagerHostgator.instance.on("query-error", (err) => {
      console.error("Query error detected:", err)
      if (
        err.code === "ECONNRESET" ||
        err.code === "PROTOCOL_CONNECTION_LOST"
      ) {
        if (!connectionManagerHostgator.reconnecting) {
          connectionManagerHostgator.attemptReconnect()
        }
      }
    })
  }

  // Recriar conexão no caso de erro crítico
  private static attemptReconnect(): void {
    if (
      connectionManagerHostgator.reconnecting ||
      connectionManagerHostgator.reconnectAttempts >=
        connectionManagerHostgator.maxReconnectAttempts
    ) {
      console.error("Max reconnect attempts reached or already reconnecting.")
      return
    }

    connectionManagerHostgator.reconnecting = true
    connectionManagerHostgator.reconnectAttempts++

    setTimeout(() => {
      console.warn(
        `Attempting to reconnect... (${connectionManagerHostgator.reconnectAttempts}/${connectionManagerHostgator.maxReconnectAttempts})`,
      )
      try {
        connectionManagerHostgator.createConnection()
        connectionManagerHostgator.reconnecting = false
        connectionManagerHostgator.reconnectAttempts = 0
        console.log("Reconnected to the database successfully.")
      } catch (err) {
        console.error("Reconnection attempt failed:", err)
        connectionManagerHostgator.reconnecting = false
        if (
          connectionManagerHostgator.reconnectAttempts <
          connectionManagerHostgator.maxReconnectAttempts
        ) {
          connectionManagerHostgator.attemptReconnect()
        }
      }
    }, connectionManagerHostgator.reconnectInterval)
  }
}

export default connectionManagerHostgator
