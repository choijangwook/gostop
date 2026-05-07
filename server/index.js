const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const roomManager = require("./roomManager");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  // 방 생성
  socket.on("createRoom", ({ roomId }) => {
    roomManager.createRoom(roomId);
    socket.join(roomId);
  });

  // 방 참가
  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    roomManager.joinRoom(roomId, socket.id);

    io.to(roomId).emit("stateUpdate", roomManager.getState(roomId));
  });

  // 카드 먹기
  socket.on("takeCard", ({ roomId, cardId }) => {
    roomManager.takeCard(roomId, socket.id, cardId);

    io.to(roomId).emit("cardTaken", roomManager.getState(roomId));
    io.to(roomId).emit("stateUpdate", roomManager.getState(roomId));
  });

  // 턴 종료
  socket.on("endTurn", ({ roomId }) => {
    roomManager.endTurn(roomId);

    io.to(roomId).emit("stateUpdate", roomManager.getState(roomId));
  });

  socket.on("disconnect", () => {
    console.log("disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("server running on 3000");
});
