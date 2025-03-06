const { exec } = require("node:child_process")

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

// Executando os comandos em sequência
executarComando("cd C:\\node\\moratense && node dist/sync.js", () => {
  console.log(new Date().toLocaleString())
  console.log("Todos os comandos foram executados!")
})

setTimeout(() => {
  // Executando os comandos em sequência
  executarComando("cd C:\\node\\moratense && node dist/sync.js", () => {
    console.log(new Date().toLocaleString())
    console.log("Todos os comandos foram executados!")
  })
}, 60000)
