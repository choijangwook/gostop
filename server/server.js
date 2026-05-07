const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("docs"));

const rooms = {};

// =========================
// socket 연결
// =========================
io.on("connection", (socket) => {

  console.log("접속:", socket.id);

  // =========================
  // 방 참가
  // =========================
  socket.on("joinRoom", ({ roomId }) => {

    roomId = Number(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: []
      };
    }

    socket.join(roomId);

    rooms[roomId].players.push(socket.id);

    io.to(roomId).emit("stateUpdate", rooms[roomId]);
  });

});

// =========================
// 서버 실행
// =========================
server.listen(10000, () => {
  console.log("🎴 GoStop server running");
});
