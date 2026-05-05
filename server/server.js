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

io.on("connection", (socket) => {
  console.log("유저 연결됨:", socket.id);

  socket.on("createRoom", () => {
    const roomId = Math.random().toString(36).substring(7);
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("서버 실행:", PORT);
});
