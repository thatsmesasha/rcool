const express = require('express')
const cameraServer = require('./RCool_camera_server')
const controlServer = require('./RCool_control_server')
const os = require('os')

try {
  const url = os.networkInterfaces().wlan0[0].address

  cameraServer.run()
  controlServer.run()

  const app = express()
  const port = 4200

  app.set('view engine', 'ejs')
  app.get('/', (req, res) => res.render(`${__dirname}/index`, { url }))

  app.listen(port, () => console.log(`RCool Server: Running on port ${port}`))

} catch (err) {
  console.error(`RCool Server: Error: ${err}`)
}
