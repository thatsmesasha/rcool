const express = require('express')
const cameraServer = require('./RCool_camera_server')
const controlServer = require('./RCool_control_server')

cameraServer.run()
controlServer.run()

const app = express()
const port = 4200

app.get('/', (req, res) => res.sendFile('index.html'))

app.listen(port, () => console.log(`RCool listening on port ${port}!`))
