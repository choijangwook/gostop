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
// 카드 덱
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
// 특수 카드
// =========================
function createSpecial() {
  return [
    "special1_draw.png",
    "special2_draw.png",
    "special3_draw.png"
  ];
}

// =========================
// 점수 계산
// =========================
function calcScore(cards) {
  let score = 0;

  for (const c of cards) {
    if (c === "DOUBLE_PI") {
      score += 2;
      continue;
    }

    if (c.includes("bright")) score += 3;
    else if (c.includes("ribbon")) score += 2;
    else score += 1;
  }

  return score;
}

// =========================
function emitState(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  io.to(roomId).emit("stateUpdate", {
    roomId,
    players: room.players,
    table: room.table,
    hands: room.hands,
    score: room.score
  });
}

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
        specialDeck: createSpecial(),
        hands: {},
        captured: {},
        score: {}
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

    if (!room.captured[socket.id]) {
      room.captured[socket.id] = [];
    }

    if (!room.score[socket.id]) {
      room.score[socket.id] = 0;
    }

    emitState(roomId);
  });

  // =========================
  // 카드 먹기
  // =========================
  socket.on("takeCard", ({ roomId, card }) => {

    const room = rooms[roomId];
    if (!room) return;

    const hand = room.hands[socket.id];
    if (!hand) return;

    const index = room.table.indexOf(card);
    if (index === -1) return;

    room.table.splice(index, 1);

    hand.push(card);
    room.captured[socket.id].push(card);

    room.score[socket.id] = calcScore(room.captured[socket.id]);

    emitState(roomId);
  });

  // =========================
  // 특수 카드
  // =========================
  socket.on("useSpecial", ({ roomId }) => {

    const room = rooms[roomId];
    if (!room) return;

    const card = room.specialDeck.shift();
    if (!card) return;

    const hand = room.hands[socket.id];
    if (!hand) return;

    const drawn = room.deck.shift();
    if (drawn) hand.push(drawn);

    room.captured[socket.id].push("DOUBLE_PI");

    room.score[socket.id] = calcScore(room.captured[socket.id]);

    emitState(roomId);
  });

  // =========================
  socket.on("disconnect", () => {

    for (const roomId in rooms) {

      const room = rooms[roomId];

      room.players = room.players.filter(p => p !== socket.id);

      delete room.hands[socket.id];
      delete room.captured[socket.id];
      delete room.score[socket.id];

      emitState(roomId);
    }
  });

});

server.listen(10000, () => {
  console.log("server running");
});
