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

const rooms = {};

console.log("서버 실행중");

io.on("connection", (socket) => {

  console.log("접속:", socket.id);

  socket.on("createRoom", () => {

    const roomId = Math.random()
      .toString(36)
      .substring(2, 8);

    rooms[roomId] = {
      host: socket.id,
      guest: null
    };

    socket.join(roomId);

    console.log("방 생성:", roomId);

    socket.emit("roomCreated", roomId);
  });

  socket.on("joinRoom", (roomId) => {

    console.log("참가 요청:", roomId);

    const room = rooms[roomId];

    if (!room) {
      socket.emit("errorMessage", "방이 존재하지 않습니다.");
      return;
    }

    if (room.guest) {
      socket.emit("errorMessage", "방이 가득 찼습니다.");
      return;
    }

    room.guest = socket.id;

    socket.join(roomId);

    console.log("게임 시작:", roomId);

    io.to(roomId).emit("startGame");
  });

  socket.on("disconnect", () => {

    for (const roomId in rooms) {

      const room = rooms[roomId];

      if (
        room.host === socket.id ||
        room.guest === socket.id
      ) {
        delete rooms[roomId];
        console.log("방 삭제:", roomId);
      }
    }
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`포트 ${PORT} 실행중`);
});
