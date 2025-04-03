import "dotenv/config"
import cron from "node-cron"
import { exec } from "node:child_process"
import path from "node:path"

function executarComando(comando: any, callback: any) {
  exec(
    comando,
    { shell: "cmd.exe", maxBuffer: 50 * 1024 * 1024 },
    (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error(`Erro: ${error.message}`)
        return
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`)
      }
      console.log(`Stdout: ${stdout}`)
      callback()
    },
  )
}

const executarRotina = async () => {
  console.log("Executando tarefa programada todos os dias às 03:00")

  executarComando(path.resolve("./dist/syncGlobus.js"), () => {
    console.log(new Date().toLocaleString())
    console.log(path.resolve("./dist/syncGlobus.js"))

    executarComando(path.resolve("./dist/vinculo.js"), () => {
      console.log(new Date().toLocaleString())
      console.log(path.resolve("./dist/vinculo.js"))

      executarComando(
        path.resolve("./dist/gerar_tabela_trip_globus.js"),
        () => {
          console.log(new Date().toLocaleString())
          console.log(path.resolve("./dist/gerar_tabela_trip_globus.js"))
        },
      )
    })
  })
}

executarRotina()

cron.schedule("* * * * *", async () => {
  console.log(new Date().toLocaleString())
})

// cron.schedule("0 3 * * *", async () => {

// })
