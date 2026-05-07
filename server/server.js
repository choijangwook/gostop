const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("docs"));

const rooms = {};

// =========================
// 연결
// =========================
io.on("connection", (socket) => {

  console.log("접속:", socket.id);

  // =========================
  // 방 참가 (핵심 수정)
  // =========================
  socket.on("joinRoom", ({ roomId }) => {

    roomId = Number(roomId);

    // 🔥 방이 없으면 무조건 생성
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: []
      };
    }

    // 방 참가
    socket.join(roomId);

    // 중복 방지
    if (!rooms[roomId].players.includes(socket.id)) {
      rooms[roomId].players.push(socket.id);
    }

    console.log(`join 성공: ${socket.id} → room ${roomId}`);

    // 🔥 반드시 상태 보내야 화면 반영됨
    io.to(roomId).emit("stateUpdate", {
      roomId,
      players: rooms[roomId].players
    });
  });

  // =========================
  // disconnect 처리
  // =========================
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(
        id => id !== socket.id
      );
    }
  });

});

server.listen(10000, () => {
  console.log("🎴 GoStop server running");
});
