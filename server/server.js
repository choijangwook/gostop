// server/server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const game = require("./game");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// 🔥 client 폴더 정적 제공
app.use(express.static(path.join(__dirname, "../client")));

let rooms = {};

io.on("connection", (socket) => {
  console.log("접속:", socket.id);

  socket.on("createRoom", () => {
    const roomId = Math.random().toString(36).substring(7);

    rooms[roomId] = {
      players: [socket.id],
      deck: game.createDeck()
    };

    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });

  socket.on("joinRoom", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.players.push(socket.id);
    socket.join(roomId);

    const state = game.dealCards(room.deck);

    io.to(roomId).emit("startGame", state);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("서버 실행:", PORT);
});
