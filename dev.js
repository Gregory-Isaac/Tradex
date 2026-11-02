import { createServer } from 'vite'
import { server as apiServer } from './server/index.js'

const viteServer = await createServer()
await viteServer.listen()
viteServer.printUrls()

let isShuttingDown = false

async function shutdown() {
  if (isShuttingDown) return
  isShuttingDown = true

  await viteServer.close()
  await new Promise((resolve, reject) => {
    apiServer.close((error) => error ? reject(error) : resolve())
  })
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    shutdown().catch((error) => {
      console.error('Unable to stop the TradeX development servers cleanly.', error)
      process.exitCode = 1
    })
  })
}
