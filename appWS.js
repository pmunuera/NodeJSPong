// Description: WebSocket server for the app

const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid');
const { log } = require('forever');
const wait = require('./utilsWait.js')
const database    = require('./utilsMySQL.js')
var db = new database()
var player1;
var player2;
var gameState="waiting"
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
var playAgain = 0
var idJugador0=0
var idJugador1=0
var color1="";
var color2="";
var username1="";
var username2="";
let result = {}
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
        this.tocs0= 0
        this.tocs1= 0
    }

    end () {
        this.wss.close()
    }

    // A websocket client connects
    newConnection (ws) {
        if(jugadors<2){
            console.log("Client connected")
            // Add client to the clients list
            const id = uuidv4()
            const color = Math.floor(Math.random() * 360)
            const metadata = { id, color,jugadors }
            this.socketsClients.set(ws, metadata)
            
            // Send clients list to everyone
            this.sendClients()
            let numeroAleatorio = Math.round(Math.random()*4);
            if(numeroAleatorio==1) ballDirection = "upRight";
            if(numeroAleatorio==2) ballDirection = "upLeft";
            if(numeroAleatorio==3) ballDirection = "downRight";
            if(numeroAleatorio==4) ballDirection = "downLeft";
            console.log(numeroAleatorio);
            console.log(ballDirection)
            // What to do when a client is disconnected
            ws.on("close", () => { 
                this.socketsClients.delete(ws)
                this.socketsClients.forEach((value, key) => {
                    this.socketsClients.delete(value)
                })
                result = {status: "Disconnect",type:"Disconnect"}
                this.broadcast(result)
                gameState="waiting"
                jugadors=jugadors-1
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
            var ballNextX = ballX;
            var ballNextY = ballY;
            if(gameState=="syncing"){
                result = {status: "Ball",type:"Ball", ballDirection: ballDirection,ballX:ballNextX,ballY:ballNextY,playerY:messageAsObject.player1Y,pointsP1:points1,pointsP2:points2,gameStatus:gameState,jugadors:jugadors}
                this.broadcast(result)
                await wait(3000)
            }
            if(jugadors==2&&gameState=="syncing"||gameState=="playing"){
                gameState="playing"
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
            } 
            else if (intersectionTop !== null) {
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
                    this.tocs0=this.tocs0+1
                    break;
                    case "upLeft": 
                    ballDirection = "upRight";
                    this.tocs0=this.tocs0+1
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
                this.tocs1=this.tocs1+1
                break;
                case "upRight": 
                ballDirection = "upLeft";
                this.tocs1=this.tocs1+1
                break;
            }

            ballX = intersectionPlayer2[0] - 1; // cambiar si el jugador es el de la izquierda a + 1
            ballY = intersectionPlayer2[1];
            ballSpeed = ballSpeed + ballSpeedIncrement;
            playerSpeed = playerSpeed + playerSpeedIncrement;
            }
            result = {status: "Ball",type:"Ball", ballDirection: ballDirection,ballX:ballNextX,ballY:ballNextY,playerY:messageAsObject.player1Y,pointsP1:points1,pointsP2:points2,gameStatus:gameState,jugadors:jugadors}
            this.broadcast(result)
        }
            
        }
        else if(messageAsObject.type=="playerDirection"){
            playerDirection=messageAsObject.direction;
            result = {status: "Direction", type:"Direction",playerDirection:playerDirection,player:messageAsObject.player}
            this.broadcast(result)
        }
        else if(messageAsObject.type=="movePlayer"){
            if(gameState=="playing"){
                switch (messageAsObject.player1Direction) {
                    case "up":
                        player1Y = player1Y - playerSpeed / fps;
                        break;
                    case "down":
                        player1Y = player1Y + playerSpeed / fps;
                        break;
                    case "none":
                        player1Y=player1Y
                        break;
                }
                switch (messageAsObject.player2Direction) {
                    case "up":
                        player2Y = player2Y - playerSpeed / fps;
                        break;
                    case "down":
                        player2Y = player2Y + playerSpeed / fps;
                        break;
                    case "none":
                        player2Y=player2Y
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
            }
            result = {status: "MovePlayer",type:"MovePlayer", player1Y:player1Y,player2Y:player2Y}
            this.broadcast(result)
        }
        else if(messageAsObject.type=="playAgain"){
            var reconected=0
            if(gameState=="gameOver"){
                gameState="waiting"
                reconected=1
            }
            else if(gameState=="waiting"&&reconected==0){
                points1=0
                points2=0
                this.tocs0= 0
                this.tocs1= 0
                player1Y=200
                player2Y=200
                gameState="syncing"
            }
        }
        else if(messageAsObject.type=="registrar"){
            try{
                await this.db.query("INSERT INTO Usuari(pseudonim,codi,color) VALUES('"+messageAsObject.pseudonim+"','"+messageAsObject.codi+"','"+messageAsObject.color+"')");
                var message = {status: "OK",type:"confirmationRegister",origin: id,destination:messageAsObject.id}
            }
            catch{
                var message = {status: "ERROR",type:"Incorrect",origin: id,destination:messageAsObject.id}
            }
            console.log(message);
            this.private(message)
        }
        else if(messageAsObject.type=="login"){
            try{
                var usuari=await this.db.query("SELECT * FROM Usuari WHERE pseudonim='"+messageAsObject.pseudonim+"' AND codi='"+messageAsObject.codi+"';")
                console.log(usuari[0]);
                if(usuari[0]!=null){
                    var message = {status: "OK",type:"confirmationLogin",origin: id,destination:messageAsObject.id,idUsuari:usuari[0].id}
                }
                else{
                    var message = {status: "ERROR",type:"confirmationLogin",origin: id,destination:messageAsObject.id}
                }
            }
            catch{
                var message = {status: "ERROR",type:"Incorrect",origin: id,destination:messageAsObject.id}
            }
            console.log(message);
            this.private(message)
        }
        else if(messageAsObject.type=="loadUsers"){
            var usuaris = await this.db.query("SELECT id,Pseudonim FROM Usuari;")
            var message = {status: "OK",type:"userList",result: usuaris,origin: id,destination:messageAsObject.id}
            this.private(message)
        }
        else if(messageAsObject.type=="getStats"){
            var comprobar = await this.db.query("SELECT count(*) AS Partides FROM Partida WHERE idJugador0="+messageAsObject.playerId+" OR idJugador1="+messageAsObject.playerId+";")
            if(comprobar[0].Partides>0){
                var guanyades = await this.db.query("SELECT count(*) AS Guanyades FROM Partida WHERE guanyador="+messageAsObject.playerId+";")
                var perdudes = await this.db.query("SELECT count(*) AS Perdudes FROM Partida WHERE (idJugador0="+messageAsObject.playerId+" OR idJugador1="+messageAsObject.playerId+") AND guanyador !="+messageAsObject.playerId+";")
                var temps0 = await this.db.query("SELECT max(duracio) AS Temps FROM Partida WHERE idJugador0="+messageAsObject.playerId+";")
                var temps1 = await this.db.query("SELECT max(duracio) AS Temps FROM Partida WHERE idJugador1="+messageAsObject.playerId+";")
                var maxTemps;
                var tocsJ0 = await this.db.query("SELECT max(tocsJugador0) AS tocsJugador0 FROM Partida WHERE idJugador0="+messageAsObject.playerId+";")
                var tocsJ1 = await this.db.query("SELECT max(tocsJugador1) AS tocsJugador1 FROM Partida WHERE idJugador1="+messageAsObject.playerId+";")
                var maxTocs = 0
                let segundosTotales0=0
                let segundosTotales1=0
                if(temps0[0].Temps!=null){
                    let [horas0, minutos0, segundos0] = temps0[0].Temps.split(":");
                    segundosTotales0 = parseInt(horas0) * 3600 + parseInt(minutos0) * 60 + parseInt(segundos0);
                }
                if(temps1[0].Temps!=null){
                    let [horas1, minutos1, segundos1] = temps1[0].Temps.split(":");
                    segundosTotales1 = parseInt(horas1) * 3600 + parseInt(minutos1) * 60 + parseInt(segundos1);
                }
                var partidaTocs;
                if(tocsJ0[0].tocsJugador0>tocsJ1[0].tocsJugador1){
                    maxTocs=tocsJ0[0].tocsJugador0
                    partidaTocs=await this.db.query("SELECT * FROM Partida WHERE idJugador0="+messageAsObject.playerId+" AND tocsJugador0="+maxTocs+";")
                }
                else{
                    maxTocs=tocsJ1[0].tocsJugador1
                    partidaTocs=await this.db.query("SELECT * FROM Partida WHERE idJugador1="+messageAsObject.playerId+" AND tocsJugador1="+maxTocs+";")
                }
                var partidaLlarga;
                if(segundosTotales0>segundosTotales1){
                    maxTemps=temps0[0].Temps
                    partidaLlarga = await this.db.query("SELECT * FROM Partida WHERE idJugador0="+messageAsObject.playerId+" AND duracio='"+maxTemps+"';")
                }
                else{
                    maxTemps=temps1[0].Temps 
                    partidaLlarga = await this.db.query("SELECT * FROM Partida WHERE idJugador1="+messageAsObject.playerId+" AND duracio='"+maxTemps+"';")
                }
                var jugadorsPartidaTocs = await this.db.query("SELECT * FROM Partida WHERE id="+partidaTocs[0].id+";")
                var timeTocs = await this.db.query("SELECT date_format(time,'%Y-%m-%d %H:%i:%s') as time FROM Partida WHERE id="+partidaTocs[0].id+";")
                console.log(timeTocs);
                var jugador0Tocs = await this.db.query("SELECT * FROM Usuari WHERE id="+jugadorsPartidaTocs[0].idJugador0+";")
                var jugador1Tocs = await this.db.query("SELECT * FROM Usuari WHERE id="+jugadorsPartidaTocs[0].idJugador1+";")
                var jugadorsPartidaLlarga = await this.db.query("SELECT * FROM Partida WHERE id="+partidaLlarga[0].id+";")
                var timeLlarga = await this.db.query("SELECT date_format(time,'%Y-%m-%d %H:%i:%s') as time FROM Partida WHERE id="+partidaLlarga[0].id+";")
                var jugador0Llarga = await this.db.query("SELECT * FROM Usuari WHERE id="+jugadorsPartidaLlarga[0].idJugador0+";")
                var jugador1Llarga = await this.db.query("SELECT * FROM Usuari WHERE id="+jugadorsPartidaLlarga[0].idJugador1+";")
                var textPartidaTocs = jugador0Tocs[0].pseudonim+" "+partidaTocs[0].tocsJugador0+" vs "+jugador1Tocs[0].pseudonim+" "+partidaTocs[0].tocsJugador1+" - "+timeTocs[0].time
                var textPartidaLlarga = jugador0Llarga[0].pseudonim+" "+partidaLlarga[0].tocsJugador0+" vs "+jugador1Llarga[0].pseudonim+" "+partidaLlarga[0].tocsJugador1+" - "+timeLlarga[0].time
                var message = {status: "OK",type:"stats",nom:messageAsObject.nom,partidaTocs:textPartidaTocs,partidaLlarga:textPartidaLlarga,guanyades:guanyades[0].Guanyades,perdudes:perdudes[0].Perdudes,maxTocs:maxTocs,temps:maxTemps,origin: id,destination:messageAsObject.id}
            }
            else{
                var message = {status: "ERROR",type:"stats",origin: id,destination:messageAsObject.id}
            }
            this.private(message)
        }
        else if(messageAsObject.type=="getColor"){
            jugadors+=1
            console.log("Jugadors "+jugadors);
            if(jugadors==1){
                var jugador1 = await this.db.query("SELECT color,pseudonim FROM Usuari WHERE id="+messageAsObject.playerId+";")
                color1=jugador1[0].color
                username1=jugador1[0].pseudonim
                idJugador0=messageAsObject.playerId;
                var message = {status: "OK",type:"playingAs",origin: id,destination:messageAsObject.id}
                console.log(message);
                this.private(message)
            }
            if(jugadors==2){
                var jugador2 = await this.db.query("SELECT color,pseudonim FROM Usuari WHERE id="+messageAsObject.playerId+";")
                color2=jugador2[0].color
                username2=jugador2[0].pseudonim
                idJugador1=messageAsObject.playerId;
                var message = {status: "OK",type:"color",color1:color1,username1:username1,color2:color2,username2:username2}
                this.broadcast(message)
                gameState="syncing"
                console.log(gameState);
            }
        }
        /*else if(messageAsObject.type=="play"){
            jugadors+=1
            if(jugadors==2){

            }
        }*/
        else if(messageAsObject.type="saveMatch"){
            const agregarCeroSiEsNecesario = valor => {
                if (valor < 10) {
                    return "0" + valor;
                } else {
                    return "" + valor;
                }
            }
            const milisegundosAMinutosYSegundos = (milisegundos) => {
                var horas = parseInt(milisegundos/ 1000 / 60 / 60)
                milisegundos -= horas*60*60*1000
                var minutos = parseInt(milisegundos / 1000 / 60);
                milisegundos -= minutos * 60 * 1000;
                var segundos = (milisegundos / 1000);
                if(segundos==60){
                    minutos=minutos+1
                }
                if(minutos==60){
                    horas=horas+1
                }
                return `${agregarCeroSiEsNecesario(horas)}:${agregarCeroSiEsNecesario(minutos)}:${agregarCeroSiEsNecesario(segundos.toFixed(0))}`;
            };
            var temps = milisegundosAMinutosYSegundos(messageAsObject.time)
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; 
            var yyyy = today.getFullYear();
            if(dd<10) {
                dd='0'+dd;
            } 
                
            if(mm<10) {
                mm='0'+mm;
            } 
            var horesMinuts=today.getHours()+":"+today.getMinutes()+":"+today.getSeconds()
            today = mm+'/'+dd+'/'+yyyy+" "+horesMinuts;
            await this.db.query("INSERT INTO Partida (time,duracio,idJugador0,idJugador1,tocsJugador0,tocsJugador1,guanyador) VALUES(STR_TO_DATE('"+today+"','%m/%d/%Y %H:%i:%s'),'"+temps+"',"+idJugador0+","+idJugador1+","+this.tocs0+","+this.tocs1+","+messageAsObject.id+")")
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
