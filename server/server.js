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

io.on("connection", (socket) => {

  console.log("접속:", socket.id);

  socket.on("createRoom", () => {

    const roomId = Math.random()
      .toString(36)
      .substring(2, 8);

    rooms[roomId] = {
      host: socket.id,
      guest: null,
      turn: socket.id
    };

    socket.join(roomId);

    socket.emit("roomCreated", roomId);

    console.log("방 생성:", roomId);
  });

  socket.on("joinRoom", (roomId) => {

    const room = rooms[roomId];

    if (!room) {
      socket.emit(
        "errorMessage",
        "방이 존재하지 않습니다."
      );
      return;
    }

    if (room.guest) {
      socket.emit(
        "errorMessage",
        "방이 가득 찼습니다."
      );
      return;
    }

    room.guest = socket.id;

    socket.join(roomId);

    io.to(roomId).emit("startGame", {
      turn: room.turn
    });

    console.log("게임 시작");
  });

  socket.on("playCard", ({ roomId }) => {

    const room = rooms[roomId];

    if (!room) return;

    // 자기 턴만 가능
    if (room.turn !== socket.id) {
      socket.emit(
        "errorMessage",
        "상대 턴입니다."
      );
      return;
    }

    // 턴 변경
    room.turn =
      socket.id === room.host
        ? room.guest
        : room.host;

    io.to(roomId).emit("turnChanged", {
      turn: room.turn
    });
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("서버 실행중");
});
