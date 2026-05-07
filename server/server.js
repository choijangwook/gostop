const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const game = require("./game");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("docs"));

io.on("connection", (socket) => {
  console.log("접속:", socket.id);

  socket.on("createRoom", ({ roomId }) => {
    game.createRoom(roomId);
    socket.join(roomId);
  });

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    game.joinRoom(roomId, socket.id);

    io.to(roomId).emit("stateUpdate", game.getState(roomId));
  });

  socket.on("takeCard", ({ roomId, cardId }) => {
    game.takeCard(roomId, socket.id, cardId);

    io.to(roomId).emit("stateUpdate", game.getState(roomId));
  });

  socket.on("endTurn", ({ roomId }) => {
    game.endTurn(roomId);

    io.to(roomId).emit("stateUpdate", game.getState(roomId));
  });
});

server.listen(10000, () => {
  console.log("🎴 Gostop 서버 실행중");
});
