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
/*db.init({
  host: process.env.MYSQLHOST || "localhost",
  port: process.env.MYSQLPORT || 3306,
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "test"
})*/
ws.init(httpServer, port, db)
app.post("conectaJugador",conectarJugador)
async function conectarJugador(req,res){
  if(jugadors==0){
    ws.newConnection
    ws.socketsClients.forEach((value, key) => {
      player1=value.id
      let result = { destination: player1}
      ws.private(result)
    })
    jugadors = jugadors+1
  }
  if(jugadors==1){
    ws.newConnection
    var count = 0
    ws.socketsClients.forEach((value, key) => {
      if(count==1){
        player2=value.id
        let result = { destination: player2}
        ws.private(result)
      }
      count=count+1
    })
    jugadors = jugadors+1
  }
}
app.post("funcionPelotaDir",funcionPelotaDir)
async function funcionPelotaDir(req,res){
    let result = {}
    var ballNextX = ballX;
    var ballNextY = ballY;
    switch (ballDirection) {
      case "upRight":
        ballNextX = ballX + ballSpeed / fps;
        ballNextY = ballY - ballSpeed / fps;
      break;
      case "upLeft":
        ballNextX = ballX - ballSpeed / fps;
        ballNextY = ballY - ballSpeed / fps;
      break;
      case "downRight":
        ballNextX = ballX + ballSpeed / fps;
        ballNextY = ballY + ballSpeed / fps;
      break;
      case "downLeft":
        ballNextX = ballX - ballSpeed / fps;
        ballNextY = ballY + ballSpeed / fps;
      break;
      }

    // Check ball collision with board sides
    var lineBall = [[ballX, ballY],[ballNextX, ballNextY]];

    var lineBoardLeft = [[borderSize, 0],[borderSize, boardHeight]];
    var intersectionLeft = findIntersection(lineBall, lineBoardLeft);

    var boardMaxX = boardWidth - borderSize;
    var lineBoardRight = [[boardMaxX, 0],[boardMaxX, boardHeight]];
    var intersectionRight = findIntersection(lineBall, lineBoardRight);

    var lineBoardTop = [[0, borderSize],[boardWidth, borderSize]];
    var intersectionTop = findIntersection(lineBall, lineBoardTop);

    var boardMaxY = boardHeight - borderSize;
    var lineBoardBot = [[0, boardMaxY],[boardWidth, boardMaxY]];
    var intersectionBot = findIntersection(lineBall, lineBoardBot);

    if (intersectionLeft !== null) {
      switch (ballDirection) {
        case "upLeft":
          ballDirection = "upRight";
        break;
        case "downLeft":
          ballDirection = "downRight";
        break;
      }
      ballX = intersectionLeft[0] + 1;
      ballY = intersectionLeft[1];
    } else if (intersectionRight !== null) {
        switch (ballDirection) {
          case "upRight":
            ballDirection = "upLeft";
          break;
          case "downRight":
            ballDirection = "downLeft";
          break;
      }
      ballX = intersectionRight[0] - 1;
      ballY = intersectionRight[1];
    } else if (intersectionTop !== null) {
        switch (ballDirection) {
          case "upRight":
            ballDirection = "downRight";
          break;
          case "upLeft":
            ballDirection = "downLeft";
          break;
          }
      ballX = intersectionTop[0];
      ballY = intersectionTop[1] + 1;
    } else if (intersectionBot !== null) {
      switch (ballDirection) {
        case "downRight":
          ballDirection = "upRight";
        break;
        case "downLeft":
          ballDirection = "upLeft";
        break;
      }
      ballX = intersectionBot[0];
      ballY = intersectionBot[1] - 1;
    } else {
      if (ballNextY > boardHeight) {
        if (intersectionLeft !== null) {
          pointsP2+=1;
          if (pointsP2==5) {
            gameStatus = "gameOver";
            result = {status: "OK", result: gameStatus}
            ws.broadcast(result)
          }
          result = {status: "OK", result: pointsP2}
          ws.broadcast(result)
        } else if (intersectionRight !== null) {
          pointsP1+=1;
          if (pointsP1==5) {
            gameStatus = "gameOver";
            result = {status: "OK", result: gameStatus}
            ws.broadcast(result)
          }
          result = {status: "OK", result: pointsP1}
          ws.broadcast(result)
        }
        
      } else {
        ballX = ballNextX;
        ballY = ballNextY;
    }
  }
    result = {status: "OK", result: ballDirection,ballX:ballX,ballY:ballY}
    ws.broadcast(result)
}

app.post("funcionPelotaJugador",funcionPelotaJugador)
async function funcionPelotaJugador(req,res){
  if(jugadors==2){
    let receivedPOST = await post.getPostObject(req)
    let result = {}
    var ballNextX
    var ballNextY
    if(receivedPOST.direction=="upLeft"){
      ballNextX = ballX + ballSpeed / fps;
      ballNextY = ballY + ballSpeed / fps;
      result = {status: "OK", result: "upRight",ballX:ballNextX,ballY:ballNextY}
    }
    else if(receivedPOST.direction=="upRight"){
      ballNextX = ballX - ballSpeed / fps;
      ballNextY = ballY + ballSpeed / fps;
      result = {status: "OK", result: "upLeft",ballX:ballNextX,ballY:ballNextY}
    }
    else if(receivedPOST.direction=="downRight"){
      ballNextX = ballX - ballSpeed / fps;
      ballNextY = ballY - ballSpeed / fps;
      result = {status: "OK", result: "downLeft",ballX:ballNextX,ballY:ballNextY}
    }
    else if(receivedPOST.direction=="downLeft"){
      ballNextX = ballX + ballSpeed / fps;
      ballNextY = ballY - ballSpeed / fps;
      result = {status: "OK", result:"downRight",ballX:ballNextX,ballY:ballNextY}
    }
    ws.broadcast(result)
}
}
/*app.post("controlJugadores",controlJugadores)
async function controlJugadores(req,res){
  let receivedPOST = await post.getPostObject(req)
  let result = {}
  if(receivedPOST.direction=="UP"){
    if(receivedPOST.player==player1){
      result
    }
  }
  else if(receivedPOST.direction=="DOWN"){

  }
}*/

function findIntersection(lineA, lineB) {
  const result = [0, 0];
  const aX0 = lineA[0][0];
  const aY0 = lineA[0][1];
  const aX1 = lineA[1][0];
  const aY1 = lineA[1][1];

  const bX0 = lineB[0][0];
  const bY0 = lineB[0][1];
  const bX1 = lineB[1][0];
  const bY1 = lineB[1][1];

  let x, y;

  if (aX1 === aX0) { // lineA is vertical
    if (bX1 === bX0) { // lineB is vertical too
      return null;
    }
    x = aX0;
    const bM = (bY1 - bY0) / (bX1 - bX0);
    const bB = bY0 - bM * bX0;
    y = bM * x + bB;
  } else if (bX1 === bX0) { // lineB is vertical
    x = bX0;
    const aM = (aY1 - aY0) / (aX1 - aX0);
    const aB = aY0 - aM * aX0;
    y = aM * x + aB;
  } else {
    const aM = (aY1 - aY0) / (aX1 - aX0);
    const aB = aY0 - aM * aX0;

    const bM = (bY1 - bY0) / (bX1 - bX0);
    const bB = bY0 - bM * bX0;

    const tolerance = 1e-5;
    if (Math.abs(aM - bM) < tolerance) {
      return null;
    }

    x = (bB - aB) / (aM - bM);
    y = aM * x + aB;
  }

  // Check if the intersection point is within the bounding boxes of both line segments
  const boundingBoxTolerance = 1e-5;
  const withinA = x >= Math.min(aX0, aX1) - boundingBoxTolerance &&
                  x <= Math.max(aX0, aX1) + boundingBoxTolerance &&
                  y >= Math.min(aY0, aY1) - boundingBoxTolerance &&
                  y <= Math.max(aY0, aY1) + boundingBoxTolerance;
  const withinB = x >= Math.min(bX0, bX1) - boundingBoxTolerance &&
                  x <= Math.max(bX0, bX1) + boundingBoxTolerance &&
                  y >= Math.min(bY0, bY1) - boundingBoxTolerance &&
                  y <= Math.max(bY0, bY1) + boundingBoxTolerance;

  if (withinA && withinB) {
    result[0] = x;
    result[1] = y;
  } else {
    return null;
  }

  return result;
}
