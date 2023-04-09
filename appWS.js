// Description: WebSocket server for the app

const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid');
const { log } = require('forever');
var player1;
var player2;
var gameState="playing"
var jugadors=0;
var points1=0;
var points2=0;
const fps = 500
let ballSpeed=200
const ballSpeedIncrement = 25
let ballX = 393
let ballY = 281
const ballSize = 15
const ballHalf = ballSize/2
let ballDirection = "upRight"
const borderSize = 5
const boardWidth=786
const boardHeight=562
let player1X = 50;
let player1Y = 200;
let player2X = 700;
let player2Y = 200;
const playerWidth = 5;
const playerHeight = 100;
const playerHalf = playerHeight / 2;
let playerSpeed = 1000;
const playerSpeedIncrement = 15
var playerDirection = "none";
class Obj {

    init (httpServer, port, db) {

        // Set reference to database
        this.db = db

        // Run WebSocket server
        this.wss = new WebSocket.Server({ server: httpServer })
        this.socketsClients = new Map()
        console.log(`Listening for WebSocket queries on ${port}`)

        // What to do when a websocket client connects
        this.wss.on('connection', (ws) => { this.newConnection(ws) })
    }

    end () {
        this.wss.close()
    }

    // A websocket client connects
    newConnection (ws) {
        if(jugadors<2){
            console.log("Client connected")
            // Add client to the clients list
            jugadors=jugadors+1;
            const id = uuidv4()
            const color = Math.floor(Math.random() * 360)
            const metadata = { id, color,jugadors }
            this.socketsClients.set(ws, metadata)
            
            // Send clients list to everyone
            this.sendClients()
            let numeroAleatorio = Math.floor(Math.random()*4+1);
            switch(numeroAleatorio){
                case 1: ballDirection = "upRight";
                case 2: ballDirection = "upLeft";
                case 3: ballDirection = "downRight";
                case 4: ballDirection = "downLeft";
            }
            console.log(numeroAleatorio);
            console.log(ballDirection)
            // What to do when a client is disconnected
            ws.on("close", () => { 
                this.socketsClients.delete(ws) 
                jugadors=jugadors-1
                gameState="playing"
                jugadors=0;
                points1=0;
                points2=0;
                player1X = 50;
                player1Y = 200;
                player2X = 700;
                player2Y = 200;
                ballX = 393
                ballY = 281
            })

            // What to do when a client message is received
            ws.on('message', (bufferedMessage) => { this.newMessage(ws, id, bufferedMessage)})
        }
    }

    // Send clientsIds to everyone connected with websockets
    sendClients () {
        var clients = []
        this.socketsClients.forEach((value, key) => {
            clients.push(value.id)
        })
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                var id = this.socketsClients.get(client).id
                var messageAsString = JSON.stringify({ status:"Clients",type: "clients", id: id, list: clients })
                client.send(messageAsString)
            }
        })
    }
  
    // Send a message to all websocket clients
    broadcast (obj) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                var messageAsString = JSON.stringify(obj)
                client.send(messageAsString)
            }
        })
    }
  
    // Send a private message to a specific websocket client
    private (obj) {
        this.wss.clients.forEach((client) => {
            if (this.socketsClients.get(client).id == obj.destination && client.readyState === WebSocket.OPEN) {
                var messageAsString = JSON.stringify(obj)
                client.send(messageAsString)
                return
            }
        })
    }

    // A message is received from a websocket client
    async newMessage (ws, id, bufferedMessage) {
        var messageAsString = bufferedMessage.toString()
        var messageAsObject = {}
            
        try { messageAsObject = JSON.parse(messageAsString) } 
        catch (e) { console.log("Could not parse bufferedMessage from WS message") }

        if (messageAsObject.type == "bounce") {
            var rst = { type: "bounce", message: messageAsObject.message }
            ws.send(JSON.stringify(rst))

        } else if (messageAsObject.type == "broadcast") {

            var rst = { type: "broadcast", origin: id, message: messageAsObject.message }
            this.broadcast(rst)

        } else if (messageAsObject.type == "private") {

            var rst = { type: "private", origin: id, destination: messageAsObject.destination, message: messageAsObject.message }
            this.private(rst)
        }
        else if(messageAsObject.type == "ballDirection"){
            let result = {}
            var ballNextX = ballX;
            var ballNextY = ballY;
            if(jugadors==2){
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
                ballX = 393
                ballY = 281
                ballSpeed=200
                playerSpeed=250
                ballDirection = "upLeft";
                points2+=1;
                if (points2==5) {
                    gameState = "gameOver";
                }
            /*switch (ballDirection) {
                case "upLeft":
                ballDirection = "upRight";
                break;
                case "downLeft":
                ballDirection = "downRight";
                break;
                }
                ballX = intersectionLeft[0] + 1;
                ballY = intersectionLeft[1];*/
            } else if (intersectionRight !== null) {
                    ballX = 393
                    ballY = 281
                    ballSpeed=200
                    playerSpeed=250
                    ballDirection = "upRight";
                    points1+=1;
                    if (points1==5) {
                        gameState = "gameOver";
                    }
                /*switch (ballDirection) {
                case "upRight":
                    ballDirection = "upLeft";
                break;
                case "downRight":
                    ballDirection = "downLeft";
                break;
            }
            ballX = intersectionRight[0] - 1;
            ballY = intersectionRight[1];*/
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
                //gameStatus = "gameOver";
                } else {
                ballX = ballNextX;
                ballY = ballNextY;
            }
            }
            let linePlayer1 = [[player1X, player1Y - playerHalf], [player1X, player1Y + playerHalf]];
            let intersectionPlayer1 = findIntersection(lineBall, linePlayer1);

            if (intersectionPlayer1 !== null) {
                switch (ballDirection) {
                    case "downLeft":
                    ballDirection = "downRight";
                    break;
                    case "upLeft": 
                    ballDirection = "upRight";
                    break;
                }
            ballX = intersectionPlayer1[0] + 1; // cambiar si el jugador es el de la izquierda a + 1
            ballY = intersectionPlayer1[1];
            ballSpeed = ballSpeed + ballSpeedIncrement;
            playerSpeed = playerSpeed + playerSpeedIncrement;
            }

            let linePlayer2 = [[player2X, player2Y + playerHalf], [player2X, player2Y - playerHalf]];
            let intersectionPlayer2 = findIntersection(lineBall, linePlayer2);

            if (intersectionPlayer2 !== null) {
            switch (ballDirection) {
                case "downRight":
                ballDirection = "downLeft";
                break;
                case "upRight": 
                ballDirection = "upLeft";
                break;
            }

            ballX = intersectionPlayer2[0] - 1; // cambiar si el jugador es el de la izquierda a + 1
            ballY = intersectionPlayer2[1];
            ballSpeed = ballSpeed + ballSpeedIncrement;
            playerSpeed = playerSpeed + playerSpeedIncrement;
            }
        }
            result = {status: "Ball",type:"Ball", ballDirection: ballDirection,ballX:ballNextX,ballY:ballNextY,playerY:messageAsObject.player1Y,pointsP1:points1,pointsP2:points2,gameStatus:gameState,jugadors:jugadors}
            this.broadcast(result)
        }
        else if(messageAsObject.type=="playerDirection"){
            let result = {}
            playerDirection=messageAsObject.direction;
            console.log(messageAsObject.player);
            result = {status: "Direction", type:"Direction",playerDirection:playerDirection,player:messageAsObject.player}
            this.broadcast(result)
        }
        else if(messageAsObject.type=="movePlayer"){
            let result = {}
            switch (messageAsObject.player1Direction) {
                case "up":
                    player1Y = player1Y - playerSpeed / fps;
                    break;
                case "down":
                    player1Y = player1Y + playerSpeed / fps;
                    break;
            }
            switch (messageAsObject.player2Direction) {
                case "up":
                    player2Y = player2Y - playerSpeed / fps;
                    break;
                case "down":
                    player2Y = player2Y + playerSpeed / fps;
                    break;
            }
            const playerMinY = 5 + borderSize + playerHalf;
            const playerMaxY = boardHeight - playerHalf - 5 - borderSize;

            if (player1Y < playerMinY) {
                player1Y = playerMinY;
            } else if (player1Y > playerMaxY) {
                player1Y = playerMaxY;
            }

            if (player2Y < playerMinY) {
                player2Y = playerMinY;
            } else if (player2Y > playerMaxY) {
                player2Y = playerMaxY;
            }
            result = {status: "MovePlayer",type:"MovePlayer", player1Y:player1Y,player2Y:player2Y}
            this.broadcast(result)
        }

        function findIntersection(lineA, lineB) {
            let result = [0, 0];
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
    }
    
}

module.exports = Obj
