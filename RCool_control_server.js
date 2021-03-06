const fs = require('fs')
const base64 = require('base64-js')
const WebSocket = require('ws')
const spawn = require('child_process').spawn

const DRIVE_CMD = 'python3'
const DRIVE_ARGS = [`${__dirname}/RCool_drive.py`]

const CAMERA_ML_CMD = 'python3'
const CAMERA_ML_ARGS = [`${__dirname}/RCool_camera_with_ml.py`]

function createFolders(ws, folderName) {
  const fullPath = `${__dirname}/${folderName}`
  if (!fs.existsSync(fullPath)) {
    try {
      fs.mkdirSync(`${fullPath}`)
      fs.mkdirSync(`${fullPath}/forward`)
      fs.mkdirSync(`${fullPath}/left`)
      fs.mkdirSync(`${fullPath}/back`)
      fs.mkdirSync(`${fullPath}/right`)
      ws.send(`Folders created at ${fullPath}`)
    } catch(err) {
      console.error(`Control Server: Error creating folders: ${err}`)
      ws.send(err.message)
    }
  } else {
    ws.send(`Warning: Folders already exist at ${fullPath}`)
  }
}

let lastImageLocation = null

function saveImage(ws, direction, folderName, lastSuccessful) {
  if (fs.existsSync(`${__dirname}/current.jpg`)) {
    // last action was not successful,
    // so we remove that image from training data
    if (!lastSuccessful && lastImageLocation) {
      fs.unlink(lastImageLocation, (err) => {
        if (err) {
          console.error(`Control Server: Error deleting last file because of going back: ${err}`)
        }
      })
    }

    const imageLocation = `${__dirname}/${folderName}/${direction}/${Date.now()}.jpg`

    fs.copyFile(`${__dirname}/current.jpg`, imageLocation, (err) => {
      if (err) {
        console.error(`Control Server: Error saving image: ${err}`)
        ws.send(err.message)
      } else {
        lastImageLocation = imageLocation
        ws.send(`Saved image to ${imageLocation}`)
      }
    })
  } else {
    console.error('Control Server: Error saving image: Don\'t have any image to save, check check if camera server is running')
    ws.send('Error saving image: Don\'t have any image to save, check check if camera server is running')
  }
}

// DRIVE CLIENT CONNECTION
function createDriveClient() {
  const drive = spawn(DRIVE_CMD, DRIVE_ARGS)
  drive.stdin.setEncoding('utf-8')
  drive.stderr.on('data', (err) => {
    console.error(`Drive Server: Error: ${err}`)
  })

  var startMessage = (data) => {
    console.log('Drive Server: Waiting for input...')
    drive.stdout.removeListener('data', startMessage)
  }

  drive.stdout.on('data', startMessage)

  return drive.stdin
}

// CAMERA & ML CLIENT CONNECTION
let runningMl = false

function createCameraMlClient() {
  const cameraWithMl = spawn(CAMERA_ML_CMD, CAMERA_ML_ARGS)
  cameraWithMl.stdin.setEncoding('utf-8')
  cameraWithMl.stderr.on('data', (err) => {
    console.error(`Camera & Ml Server: Error: ${err}`)
  })

  var startMessage = (data) => {
    console.log('Camera & Ml Server: Waiting for input...')
    cameraWithMl.stdout.removeListener('data', startMessage)
  }

  cameraWithMl.stdout.on('data', startMessage)

  return cameraWithMl
}


// CONTROL SERVER

function createControlServer(drive, ml) {
  const wss = new WebSocket.Server({ port: 4202 });

  wss.on('listening', () => {
    console.log('Control Server: Waiting for connections...')
  })

  wss.on('connection', (ws, req) => {
    console.log(`Control Server: Client ${req.connection.remoteAddress}: Connected`)

    let folderNameAuto = null

    const streamMlData = (data) => {
      data = String.fromCharCode.apply(null, data)
      if (!data.startsWith('prediction:')) return

      let [_, timestamp, direction, probability] = data.trim().split(' ')
      drive.write(direction + '\n')

      if (folderNameAuto) {
        saveImage(ws, direction, folderNameAuto, direction != 'back')
      }

      try {
        ws.send(`Predicted direction '${direction}' with probability ${probability}`)
      } catch (err) {

      }
    }

    ml.stdout.on('data', streamMlData)

    ws.on('message', (data) => {
      console.log(`Control Server: Client ${req.connection.remoteAddress}: ${data}`)
      try {
        data = JSON.parse(data)
      } catch(err) {
        console.error(`Control Server: Client ${req.connection.remoteAddress}: Error: data is not in json format`)
      }
      if (typeof data.folderName == 'string' && typeof data.direction == 'string') {
        if (runningMl) {
          // had to switch to manual mode, so last action not successful
          saveImage(ws, data.direction, data.folderName, false)
        } else {
          saveImage(ws, data.direction, data.folderName, data.direction != 'back')
        }
        drive.write(data.direction + '\n')
      } else if (typeof data.auto == 'boolean') {
        runningMl = data.auto
        if (data.auto) {
          ml.stdin.write('on\n')
        } else {
          ml.stdin.write('off\n')
        }
        if (typeof data.folderName == 'string') {
          folderNameAuto = data.folderName
        } else {
          folderNameAuto = null
        }
      } else if (typeof data.folderName == 'string') {
        createFolders(ws, data.folderName)
      } else if (typeof data.direction == 'string') {
        drive.write(data.direction + '\n')
      } else {
        console.error(`Control Server: Client ${req.connection.remoteAddress}: Error: no command corresponds to the received message`)
      }
    })

    ws.on('close', () => {
      console.log(`Control Server: Client ${req.connection.remoteAddress}: Disconnected`)
      runningMl = false
      ml.stdin.write('off\n')
      ml.stdout.removeListener('data', streamMlData)
    })
  })
}

function run() {
  const drive = createDriveClient()
  const ml = createCameraMlClient()
  createControlServer(drive, ml)
}

module.exports = {
  run,
}
