const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*" }
});

app.use(express.static("docs"));

const rooms = {};

// =========================
// 카드 생성
// =========================
function createDeck() {
  const deck = [];

  for (let i = 1; i <= 12; i++) {
    deck.push(`${i}_bright.png`);
    deck.push(`${i}_animal.png`);
    deck.push(`${i}_ribbon.png`);
    deck.push(`${i}_junk1.png`);
  }

  return deck.sort(() => Math.random() - 0.5);
}

// =========================
// SOCKET
// =========================
io.on("connection", (socket) => {

  console.log("connect:", socket.id);

  // =========================
  socket.on("joinRoom", ({ roomId }) => {

    roomId = Number(roomId);

    if (!rooms[roomId]) {
      const deck = createDeck();

      rooms[roomId] = {
        players: [],
        table: deck.splice(0, 6),
        deck,
        hands: {}
      };
    }

    const room = rooms[roomId];

    socket.join(roomId);

    // 🔥 중복 방지 (핵심)
    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    // 🔥 손패 없으면만 지급
    if (!room.hands[socket.id]) {
      room.hands[socket.id] = room.deck.splice(0, 5);
    }

    emitState(roomId);
  });

  // =========================
  socket.on("disconnect", () => {

    for (const roomId in rooms) {

      const room = rooms[roomId];

      room.players = room.players.filter(p => p !== socket.id);

      delete room.hands[socket.id];

      emitState(roomId);
    }
  });

});

// =========================
// 상태 전송
// =========================
function emitState(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  io.to(roomId).emit("stateUpdate", {
    roomId,
    players: room.players,
    table: room.table,
    hands: room.hands
  });
}

server.listen(10000, () => {
  console.log("server running");
});
