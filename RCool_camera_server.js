const spawn = require('child_process').spawn
const WebSocket = require('ws')
const base64 = require('base64-js')
const fs = require('fs')

const RASPI_CMD = '/opt/vc/bin/raspistill'
const RASPI_ARGS = [
  '-w', '160',
  '-h', '160',
  '-tl', '0',
  '-t', '999999999',
  '-o', 'current.jpg',
]

function createCameraServer() {
  const raspi = spawn(RASPI_CMD, RASPI_ARGS)
  raspi.stdin.setEncoding('utf-8')
  raspi.on('error', (err) => {
    console.error(`Camera Server: Error: ${err}`)
  })

  const wss = new WebSocket.Server({ port: 4201 })

  wss.on('listening', () => {
    console.log('Camera Server: Waiting for connections...')
  })

  const connectedWs = []

  fs.watch(`${__dirname}`, function (event, filename) {
    if (filename == 'current.jpg') {
      fs.readFile(`${__dirname}/current.jpg`, function(err, buf) {
        if (err) {
          console.error(`Camera Server: Error: ${err}`)
        } else {
          connectedWs.map((ws) => {
            try {
              ws.send(buf.toString('base64'))
            } catch (err) {
              console.warning(`Camera Server: Warning: ${err}`)
            }
          })
        }
      })
    }
  })


  wss.on('connection', (ws, req) => {
    console.log(`Camera Server: Client ${req.connection.remoteAddress}: Connected`)
    connectedWs.push(ws)

    ws.on('close', () => {
      console.log(`Camera Server: Client ${req.connection.remoteAddress}: Disconnected`)
      if (connectedWs.indexOf(ws) != -1) {
        connectedWs.splice(connectedWs.indexOf(ws), 1)
      }
    })
  })
}

function run() {
  createCameraServer()
}

module.exports = {
  run,
}
