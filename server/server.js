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

// =========================
// socket
// =========================
io.on("connection", (socket) => {

  console.log("connect:", socket.id);

  // =========================
  // 방 참가
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

    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    if (!room.hands[socket.id]) {
      room.hands[socket.id] = room.deck.splice(0, 5);
    }

    emitState(roomId);
  });

  // =========================
  // 🔥 카드 먹기 기능
  // =========================
  socket.on("takeCard", ({ roomId, card }) => {

    const room = rooms[roomId];
    if (!room) return;

    const hand = room.hands[socket.id];
    if (!hand) return;

    const index = room.table.indexOf(card);

    if (index === -1) return;

    // 테이블에서 제거
    room.table.splice(index, 1);

    // 내 손패로 이동
    hand.push(card);

    emitState(roomId);
  });

  // =========================
  // disconnect
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

server.listen(10000, () => {
  console.log("server running");
});
