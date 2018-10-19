const fs = require('fs')
const base64 = require('base64-js')
const WebSocket = require('ws')
const spawn = require('child_process').spawn

const DRIVE_CMD = 'python3'
const DRIVE_ARGS = [`${__dirname}/RCool_drive.py`]

const ML_CMD = 'python3'
const ML_ARGS = [`${__dirname}/RCool_ml.py`]
const ML_OPTIONS = { env: Object.create(process.env) }
ML_OPTIONS.env.VISION_BONNET_MODELS_PATH = __dirname

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
  drive.stderr.on('data', (err) => {
    console.error(`Drive Server: Error: ${err}`)
  })
  return drive.stdin
}

// ML CLIENT CONNECTION
let runningMl = false

function createMlClient() {
  const ml = spawn(ML_CMD, ML_ARGS, ML_OPTIONS)
  ml.stdin.setEncoding('utf-8')
  ml.stderr.on('data', (err) => {
    console.error(`Ml Server: Error: ${err}`)
  })
  setTimeout(() => setInterval(() => runningMl ? ml.stdin.write('\n') : null, 1000), 10000)
  return ml.stdout
}


// CONTROL SERVER

function createControlServer(drive, ml) {
  const wss = new WebSocket.Server({ port: 4202 });

  wss.on('listening', () => {
    console.log('Control Server: Waiting for connections...')
  })

  wss.on('connection', (ws, req) => {
    console.log(`Control Server: Client ${req.connection.remoteAddress}: Connected`)

    let folderName = null
    const streamMlData = (data) => {
      data = String.fromCharCode.apply(null, data)
      if (!data.startsWith('prediction:')) return

      let [_, timestamp, direction, probability] = data.trim().split(' ')
      timestamp = float(timestamp)
      // max delay should be less then 0.5 seconds, otherwise discard it
      const delay = (new Date).getTime() / 1000 - timestamp
      if (delay <= 0.5 ) {
        console.log(`Ml Server: Predicted direction '${direction}' with probability ${probability} in ${delay}s`)
        try {
          ws.send(JSON.stringify({ direction, probability }))
        } catch (err) {

        }
      } else {
        console.warn(`Ml Server: Warning: Delay is ${delay}s, discarding prediction`)
        try {
          ws.send(JSON.stringify({ warning: 'Ml took too long to predict' }))
        } catch (err) {

        }
      }
    }

    ml.on('data', streamMlData)

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
        runningMl = data.auto
      } else {
        console.error(`Control Server: Client ${req.connection.remoteAddress}: Error: no command corresponds to the received message`)
      }
    })

    ws.on('close', () => {
      console.log(`Control Server: Client ${req.connection.remoteAddress}: Disconnected`)
      runningMl = false
      ml.removeListener('data', streamMlData)
    })
  })
}

function run() {
  createCameraClient()
  const drive = createDriveClient()
  const ml = createMlClient()
  createControlServer(drive, ml)
}

module.exports = {
  run,
}
