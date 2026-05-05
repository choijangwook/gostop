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

let rooms = {};

function createDeck() {
  const deck = [];
  for (let i = 1; i <= 12; i++) {
    for (let j = 0; j < 4; j++) {
      deck.push({ month: i });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function dealCards(deck) {
  return {
    player1: deck.splice(0, 10),
    table: deck.splice(0, 8),
    draw: deck
  };
}

io.on("connection", (socket) => {
  console.log("접속:", socket.id);

  socket.on("createRoom", () => {
    const roomId = Math.random().toString(36).substring(7);

    const deck = createDeck();

    rooms[roomId] = {
      players: [socket.id],
      state: dealCards(deck)
    };

    socket.join(roomId);

    socket.emit("roomCreated", roomId);

    // 🔥 혼자도 바로 시작
    socket.emit("startGame", rooms[roomId].state);
  });

  socket.on("joinRoom", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.players.push(socket.id);
    socket.join(roomId);

    io.to(roomId).emit("startGame", room.state);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("서버 실행:", PORT);
});
