const spawn = require('child_process').spawn
const WebSocket = require('ws')
const base64 = require('base64-js')


const RASPI_CMD = '/opt/vc/bin/raspistill'
const RASPI_ARGS = [
  '-w', '160',
  '-h', '160',
  '-k', // receive new image when pressing enter
  '-t', '999999999', // max time recording
  '-o', '-', // output to stdout
]

function createCameraServer() {
  const raspi = spawn(RASPI_CMD, RASPI_ARGS)
  raspi.stdin.setEncoding('utf-8')
  raspi.on('error', (err) => {
    console.error(`Camera Server: Error: ${err}`)
  })

  setInterval(() => raspi.stdin.write('\n'), 50)

  const wss = new WebSocket.Server({ port: 4201 })

  wss.on('listening', () => {
    console.log('Camera Server: Waiting for connections...')
  })

  wss.on('connection', (ws, req) => {
    console.log(`Camera Server: Client ${req.connection.remoteAddress}: Connected`)

    var currentData = (data) => {
      try {
        ws.send(base64.fromByteArray(data))
      } catch (err) {

      }
    }

    raspi.stdout.on('data', currentData)

    ws.on('close', () => {
      console.log(`Camera Server: Client ${req.connection.remoteAddress}: Disconnected`)
      raspi.stdout.removeListener('data', currentData)
    })
  })
}

function run() {
  createCameraServer()
}

module.exports = {
  run,
}
