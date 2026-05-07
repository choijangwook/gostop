const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*"
  }
});

app.use(express.static("docs"));

const rooms = {};

// =========================
io.on("connection", (socket) => {

  console.log("접속:", socket.id);

  // =========================
  socket.on("joinRoom", ({ roomId }) => {

    roomId = Number(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: []
      };
    }

    socket.join(roomId);

    if (!rooms[roomId].players.includes(socket.id)) {
      rooms[roomId].players.push(socket.id);
    }

    console.log("join:", roomId, rooms[roomId].players);

    io.to(roomId).emit("stateUpdate", {
      roomId,
      players: rooms[roomId].players
    });
  });

  // =========================
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId].players =
        rooms[roomId].players.filter(id => id !== socket.id);
    }
  });

});

server.listen(10000, () => {
  console.log("server running");
});
