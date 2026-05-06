const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let rooms = {};

io.on("connection", (socket) => {

  console.log("유저 접속:", socket.id);

  socket.on("createRoom", () => {
    console.log("createRoom 호출됨");

    const roomId = Math.random().toString(36).substring(7);

    rooms[roomId] = {
      users: [socket.id]
    };

    socket.join(roomId);

    // 🔥 이게 핵심 (없으면 절대 안 됨)
    socket.emit("roomCreated", roomId);
  });

  socket.on("joinRoom", (roomId) => {
    console.log("joinRoom:", roomId);

    const room = rooms[roomId];
    if (!room) return;

    room.users.push(socket.id);
    socket.join(roomId);

    io.to(roomId).emit("startGame", {
      player: [],
      opponentCount: 0,
      table: [],
      turn: socket.id
    });
  });

});

server.listen(process.env.PORT || 3000);
