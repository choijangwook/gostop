const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {};

// =========================
// 카드
// =========================

function createDeck() {

  const cards = [];

  for (let i = 1; i <= 12; i++) {

    cards.push(`${i}_bright.png`);
    cards.push(`${i}_animal.png`);
    cards.push(`${i}_ribbon.png`);
    cards.push(`${i}_junk1.png`);
  }

  cards.push("special1_draw.png");
  cards.push("special2_draw.png");
  cards.push("special3_draw.png");

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

// =========================
// 방 생성
// =========================

function createRoom(roomId) {

  const deck = createDeck();

  const room = {
    roomId,
    players: [],
    hands: {},
    captured: {},
    table: [],
    deck,
    turn: null,
    winner: null,
    lastCapture: false
  };

  for (let i = 0; i < 8; i++) {
    room.table.push(deck.pop());
  }

  rooms[roomId] = room;
  return room;
}

// =========================
// 턴
// =========================

function nextTurn(room, id) {
  const idx = room.players.indexOf(id);
  room.turn = room.players[(idx + 1) % room.players.length];
}

// =========================
// 월 추출
// =========================

function month(card) {
  return card.split("_")[0];
}

// =========================
// 고스톱 핵심 로직
// =========================

function play(room, playerId, card) {

  const hand = room.hands[playerId];
  if (!hand) return;

  const idx = hand.indexOf(card);
  if (idx === -1) return;

  hand.splice(idx, 1);

  const m = month(card);

  const match = room.table.find(c => month(c) === m);

  room.lastCapture = false;

  // =====================
  // 먹기 성공
  // =====================

  if (match) {

    room.table = room.table.filter(c => c !== match);

    room.captured[playerId].push(card);
    room.captured[playerId].push(match);

    room.lastCapture = true;

  } else {

    // 실패 → 바닥
    room.table.push(card);
  }

  // =====================
  // 드로우
  // =====================

  if (room.deck.length > 0) {

    const draw = room.deck.pop();

    const dm = month(draw);

    const dmatch = room.table.find(c => month(c) === dm);

    if (dmatch) {

      room.table = room.table.filter(c => c !== dmatch);

      room.captured[playerId].push(draw);
      room.captured[playerId].push(dmatch);

      room.lastCapture = true;

    } else {
      room.table.push(draw);
    }
  }

  nextTurn(room, playerId);

  send(room);
}

// =========================
// 상태 전송
// =========================

function send(room) {
  if (!room) return;
  io.to(room.roomId).emit("stateUpdate", room);
}

// =========================
// socket
// =========================

io.on("connection", socket => {

  socket.on("joinRoom", data => {

    let room = rooms[data.roomId];
    if (!room) room = createRoom(data.roomId);

    socket.join(data.roomId);

    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    if (!room.hands[socket.id]) {

      room.hands[socket.id] = [];
      room.captured[socket.id] = [];

      for (let i = 0; i < 10; i++) {
        room.hands[socket.id].push(room.deck.pop());
      }
    }

    if (!room.turn) room.turn = room.players[0];

    send(room);
  });

  socket.on("playCard", data => {

    const room = rooms[data.roomId];
    if (!room) return;

    if (room.turn !== socket.id) return;

    play(room, socket.id, data.card);
  });
});

server.listen(process.env.PORT || 10000, () => {
  console.log("server running");
});
