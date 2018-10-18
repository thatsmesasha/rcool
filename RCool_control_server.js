const fs = require('fs')
const base64 = require('base64-js')
const WebSocket = require('ws')
const spawn = require('child_process').spawn

const DRIVE_CMD = 'python3'
const DRIVE_ARGS = [`${__dirname}/RCool_drive.py`]

function createFolders(ws, folderName) {
  const fullPath = `${__dirname}/${folderName}`
  if (!fs.existsSync(fullPath)) {
    try {
      fs.mkdirSync(`${fullPath}`)
      fs.mkdirSync(`${fullPath}/forward`)
      fs.mkdirSync(`${fullPath}/left`)
      fs.mkdirSync(`${fullPath}/back`)
      fs.mkdirSync(`${fullPath}/right`)
      ws.send(`Folders created at ${fullPath}, you can start training process`)
    } catch(err) {
      console.error(`Control Server: Error creating folders: ${err}`)
      ws.send(err.message)
    }
  } else {
    ws.send(`Folders already exist at ${fullPath}, you can start training process`)
  }
}

function saveImage(ws, direction, folderName) {
  if (lastImage) {
    const imageLocation = `${__dirname}/${folderName}/${direction}/${Date.now()}.png`
    fs.writeFile(imageLocation, lastImage, 'base64', function(err) {
      if (err) {
        console.error(`Control Server: Error saving image: ${err}`)
        ws.send(err.message)
      } else {
        ws.send(`Saved image to ${imageLocation}`)
      }
    })
  } else {
    console.error('Control Server: Error saving image: Don\'t have any image to save, check connection to the camera server')
    ws.send('Error saving image: Don\'t have any image to save, check connection to the camera server')
  }
}

// CAMERA CLIENT CONNECTION
let lastImage = null

function createCameraClient() {
  const cameraWs = new WebSocket('ws://localhost:4201')

  cameraWs.on('open', () => {
    console.log('Control Server: Connected to Camera Server')
  })

  cameraWs.on('close', () => {
    console.log('Control Server: Disconnected Camera Server')
  })

  cameraWs.on('message', (message) => {
    lastImage = message
  })
}

// DRIVE CLIENT CONNECTION
function createDriveClient() {
  const drive = spawn(DRIVE_CMD, DRIVE_ARGS)
  drive.stdin.setEncoding('utf-8')
  drive.stdout.on('data', (data) => {
    console.log(`Drive Server: ${data}`)
  })
  drive.on('error', (err) => {
    console.error(`Drive Server: Error: ${err}`)
  })
  return drive.stdin
}

// ML CLIENT CONNECTION
// TODO

// CONTROL SERVER

function createControlServer(drive) {
  const wss = new WebSocket.Server({ port: 4202 });

  wss.on('listening', () => {
    console.log('Control Server: Waiting for connections...')
  })

  wss.on('connection', (ws, req) => {
    console.log(`Control Server: Client ${req.connection.remoteAddress}: Connected`)

    let folderName = null

    ws.on('message', (data) => {
      console.log(`Control Server: Client ${req.connection.remoteAddress}: ${data}`)
      try {
        data = JSON.parse(data)
      } catch(err) {
        console.error(`Control Server: Client ${req.connection.remoteAddress}: Error: data is not in json format`)
      }
      if (typeof data.folderName == 'string' && typeof data.direction == 'string') {
        saveImage(ws, data.direction, data.folderName)
        drive.write(data.direction + '\n')
      } else if (typeof data.folderName == 'string') {
        createFolders(ws, data.folderName)
      } else if (typeof data.direction == 'string') {
        drive.write(data.direction + '\n')
      } else if (typeof data.auto == 'boolean') {
        // TODO turn on/off ml wss
      } else {
        console.error(`Control Server: Client ${req.connection.remoteAddress}: Error: no command corresponds to the received message`)
      }
    })

    ws.on('close', () => {
      console.log(`Control Server: Client ${req.connection.remoteAddress}: Disconnected`)
      // TODO turn off ml mode
    })
  })
}

function run() {
  createCameraClient()
  const drive = createDriveClient()
  // TODO create ml client
  createControlServer(drive)
}

module.exports = {
  run,
}
