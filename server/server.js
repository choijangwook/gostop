const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

// 🔥 핵심: CORS 허용 추가
const io = socketIo(server, {
  cors: {
    origin: "*",   // 또는 "https://choijangwook.github.io"
    methods: ["GET", "POST"]
  }
}); 

app.use(express.static("docs"));

const rooms = {};

io.on("connection", (socket) => {

  console.log("접속:", socket.id);

  socket.on("joinRoom", ({ roomId }) => {

    roomId = Number(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = { players: [] };
    }

    socket.join(roomId);

    if (!rooms[roomId].players.includes(socket.id)) {
      rooms[roomId].players.push(socket.id);
    }

    io.to(roomId).emit("stateUpdate", {
      roomId,
      players: rooms[roomId].players
    });
  });

});

server.listen(10000, () => {
  console.log("server running");
});
