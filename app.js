const express     = require('express')
const fs          = require('fs').promises

const webSockets  = require('./appWS.js')
const post        = require('./utilsPost.js')
const database    = require('./utilsMySQL.js')
const wait        = require('./utilsWait.js')

var db = new database()   // Database example: await db.query("SELECT * FROM test")
var ws = new webSockets()
var jugadors = 0
var player1;
var player2;
var points1=0;
var points2=0;
const fps = 60
const ballSpeed=200
let ballX = Number.POSITIVE_INFINITY
let ballY = Number.POSITIVE_INFINITY
const ballSize = 15
const ballHalf = ballSize/2
let ballDirection = "upRight"

// Start HTTP server
const app = express()
const port = process.env.PORT || 3000

// Publish static files from 'public' folder
app.use(express.static('public'))

// Activate HTTP server
const httpServer = app.listen(port, appListen)
console.log(httpServer);
function appListen () {
  console.log(`Listening for HTTP queries on: http://localhost:${port}`)
}

// Close connections when process is killed
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  httpServer.close()
  db.end()
  ws.end()
  process.exit(0);
}

// Init objects
db.init({
  host: process.env.MYSQLHOST || "containers-us-west-28.railway.app",
  port: process.env.MYSQLPORT || 7579,
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "VoeI75zSgpyjurBpir8k",
  database: process.env.MYSQLDATABASE || "railway"
})
ws.init(httpServer, port, db)