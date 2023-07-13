const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const { getRandomName } = require("./username");
const Game = require("./game");

const connectedSockets = {};

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile("/index.html");
});

const game = new Game(io, 6, 14, 224);

io.on("connection", (socket) => {
  const name = getRandomName(Object.values(connectedSockets));
  connectedSockets[socket] = name;
  game.onConnect(name);

  socket.on("restart", () => {
    game.populateBoard();
    game.nextTurn();
  });

  socket.on("flip_card", (data) => {
    console.log(data);
    game.flipCard(name, data[0], data[1]);
  });

  socket.on("disconnect", () => {
    game.onDisconnect(name);
    delete connectedSockets[socket];
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
