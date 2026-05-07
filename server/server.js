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
function createAI() {
  return "AI_" + Math.random().toString(36).substr(2, 5);
}

// =========================
function emitState(roomId) {

  const room = rooms[roomId];
  if (!room) return;

  io.to(roomId).emit("stateUpdate", {
    roomId,
    table: room.table,
    hands: room.hands,
    captured: room.captured
  });
}

// =========================
function aiMove(roomId) {

  const room = rooms[roomId];
  if (!room) return;

  const ai = room.ai;

  const hand = room.hands[ai];
  const table = room.table;

  if (!hand.length || !table.length) return;

  const randomHand = hand[Math.floor(Math.random() * hand.length)];
  const randomTable = table[Math.floor(Math.random() * table.length)];

  // 제거
  hand.splice(hand.indexOf(randomHand), 1);
  table.splice(table.indexOf(randomTable), 1);

  room.captured[ai].push(randomTable);

  emitState(roomId);
}

// =========================
io.on("connection", (socket) => {

  socket.on("joinRoom", ({ roomId }) => {

    roomId = Number(roomId);

    if (!rooms[roomId]) {

      const deck = createDeck();

      const ai = createAI();

      rooms[roomId] = {
        players: [],
        ai,
        table: deck.splice(0, 6),
        deck,
        hands: {},
        captured: {}
      };

      // AI 초기 패
      rooms[roomId].hands[ai] = deck.splice(0, 5);
      rooms[roomId].captured[ai] = [];
    }

    const room = rooms[roomId];

    socket.join(roomId);

    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    if (!room.hands[socket.id]) {
      room.hands[socket.id] = room.deck.splice(0, 5);
    }

    if (!room.captured[socket.id]) {
      room.captured[socket.id] = [];
    }

    emitState(roomId);
  });

  // =========================
  socket.on("selectHand", ({ roomId, card }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.selectedHand = room.selectedHand || {};
    room.selectedHand[socket.id] = card;
  });

  // =========================
  socket.on("takeCard", ({ roomId, tableCard }) => {

    const room = rooms[roomId];
    if (!room) return;

    const hand = room.hands[socket.id];
    const selected = room.selectedHand?.[socket.id];

    if (!selected) return;

    const ti = room.table.indexOf(tableCard);
    if (ti === -1) return;

    const hi = hand.indexOf(selected);
    if (hi !== -1) hand.splice(hi, 1);

    room.table.splice(ti, 1);

    room.captured[socket.id].push(tableCard);

    emitState(roomId);

    // 🔥 AI 턴 자동 실행
    setTimeout(() => aiMove(roomId), 800);
  });

});

server.listen(10000, () => {
  console.log("AI GoStop server running");
});
