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
// 덱 생성
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
// 특수카드
// =========================
function createSpecial() {
  return [
    "special1_draw.png",
    "special2_draw.png",
    "special3_draw.png"
  ];
}

// =========================
// 점수 엔진
// =========================
function calculateScore(cards) {

  let score = 0;

  const bright = cards.filter(c => c.includes("bright"));

  if (bright.length >= 5) score += 15;
  else if (bright.length === 4) score += 4;
  else if (bright.length === 3) score += 2;

  const gokdori = ["2_animal.png", "4_animal.png", "8_animal.png"];
  if (gokdori.every(c => cards.includes(c))) score += 5;

  const cheongdan = ["6_ribbon.png", "9_ribbon.png", "10_ribbon.png"];
  if (cheongdan.every(c => cards.includes(c))) score += 3;

  const hongdan = ["1_ribbon.png", "2_ribbon.png", "3_ribbon.png"];
  if (hongdan.every(c => cards.includes(c))) score += 3;

  const chodan = ["4_ribbon.png", "5_ribbon.png", "7_ribbon.png"];
  if (chodan.every(c => cards.includes(c))) score += 3;

  const animals = cards.filter(c => c.includes("animal"));
  if (animals.length >= 5) {
    score += (animals.length - 4);
  }

  const doublePi = cards.filter(c => c === "DOUBLE_PI");
  score += doublePi.length * 2;

  return score;
}

// =========================
// 상태 전송
// =========================
function emitState(roomId) {

  const room = rooms[roomId];
  if (!room) return;

  const score = {};

  for (const pid in room.captured) {
    score[pid] = calculateScore(room.captured[pid]);
  }

  io.to(roomId).emit("stateUpdate", {
    roomId,
    players: room.players,
    table: room.table,
    hands: room.hands,
    score
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
        specialDeck: createSpecial(),
        hands: {},
        captured: {},
        selectedHand: {} // 🔥 선택 카드 저장
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

    room.selectedHand[socket.id] = null;

    emitState(roomId);
  });

  // =========================
  // Hand 선택
  // =========================
  socket.on("selectHand", ({ roomId, card }) => {

    const room = rooms[roomId];
    if (!room) return;

    room.selectedHand[socket.id] = card;
  });

  // =========================
  // Table 클릭 → 먹기
  // =========================
  socket.on("takeCard", ({ roomId, tableCard }) => {

    const room = rooms[roomId];
    if (!room) return;

    const handCard = room.selectedHand[socket.id];
    if (!handCard) return;

    const tableIndex = room.table.indexOf(tableCard);
    if (tableIndex === -1) return;

    const hand = room.hands[socket.id];

    const handIndex = hand.indexOf(handCard);
    if (handIndex !== -1) {
      hand.splice(handIndex, 1);
    }

    room.table.splice(tableIndex, 1);

    room.captured[socket.id].push(tableCard);

    room.selectedHand[socket.id] = null;

    emitState(roomId);
  });

  // =========================
  // 특수카드
  // =========================
  socket.on("useSpecial", ({ roomId }) => {

    const room = rooms[roomId];
    if (!room) return;

    const hand = room.hands[socket.id];

    const drawn = room.deck.shift();
    if (drawn) hand.push(drawn);

    room.captured[socket.id].push("DOUBLE_PI");

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
      delete room.captured[socket.id];
      delete room.selectedHand[socket.id];

      emitState(roomId);
    }
  });

});

server.listen(10000, () => {
  console.log("server running");
});
