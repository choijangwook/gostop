const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const roomManager = require("./roomManager");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("docs"));

io.on("connection", (socket) => {

  socket.on("createRoom", ({ roomId }) => {
    roomManager.createRoom(roomId);
    socket.join(roomId);
  });

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    roomManager.joinRoom(roomId, socket.id);

    io.to(roomId).emit("stateUpdate", roomManager.getState(roomId));
  });

  socket.on("takeCard", ({ roomId, cardId }) => {
    roomManager.takeCard(roomId, socket.id, cardId);

    // 🔥 무조건 전체 덮어쓰기
    io.to(roomId).emit("stateUpdate", roomManager.getState(roomId));
  });

  socket.on("endTurn", ({ roomId }) => {
    roomManager.endTurn(roomId);

    io.to(roomId).emit("stateUpdate", roomManager.getState(roomId));
  });
});

server.listen(3000, () => {
  console.log("server running");
});
