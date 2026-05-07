const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

let rooms = {};

io.on("connection", (socket) => {

  console.log("접속:", socket.id);

  socket.on("createRoom", () => {

    console.log("방 만들기 요청");

    const roomId = Math.random().toString(36).substring(2, 8);

    rooms[roomId] = {
      users: [socket.id]
    };

    socket.join(roomId);

    // 🔥 핵심
    socket.emit("roomCreated", roomId);

    console.log("방 생성 완료:", roomId);
  });

  socket.on("joinRoom", (roomId) => {

    console.log("참가 요청:", roomId);

    const room = rooms[roomId];

    if (!room) {
      console.log("방 없음");
      return;
    }

    room.users.push(socket.id);

    socket.join(roomId);

    io.to(roomId).emit("startGame", {
      player: [],
      opponentCount: 0,
      table: [],
      turn: room.users[0]
    });

    console.log("게임 시작");
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("서버 실행중");
});
