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

  console.log("유저 접속:", socket.id);

  // =========================
  // 방 만들기
  // =========================
  socket.on("createRoom", () => {

    console.log("방 만들기 요청");

    const roomId = Math.random()
      .toString(36)
      .substring(2, 8);

    rooms[roomId] = {
      users: [socket.id]
    };

    socket.join(roomId);

    console.log("방 생성 완료:", roomId);

    // 🔥 클라이언트로 방 코드 전송
    socket.emit("roomCreated", roomId);
  });

  // =========================
  // 방 참가
  // =========================
  socket.on("joinRoom", (roomId) => {

    console.log("참가 요청:", roomId);

    if (!roomId) {
      console.log("방 코드 없음");
      return;
    }

    const room = rooms[roomId];

    if (!room) {
      console.log("존재하지 않는 방");
      socket.emit("errorMessage", "존재하지 않는 방입니다.");
      return;
    }

    if (room.users.length >= 2) {
      console.log("방 가득참");
      socket.emit("errorMessage", "방이 가득 찼습니다.");
      return;
    }

    room.users.push(socket.id);

    socket.join(roomId);

    console.log("게임 시작:", roomId);

    io.to(roomId).emit("startGame", {
      roomId
    });
  });

  // =========================
  // 연결 종료
  // =========================
  socket.on("disconnect", () => {

    console.log("연결 종료:", socket.id);

    for (const roomId in rooms) {

      const room = rooms[roomId];

      room.users = room.users.filter(
        id => id !== socket.id
      );

      if (room.users.length === 0) {
        delete rooms[roomId];
        console.log("빈 방 삭제:", roomId);
      }
    }
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`포트 ${PORT} 에서 실행중`);
});
