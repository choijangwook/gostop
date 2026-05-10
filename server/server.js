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
// 방 생성
// =========================

function createRoom(roomId) {
  return {
    roomId,
    players: [],
    names: {},
    hands: {},
    captured: {},
    table: [],
    deck: createDeck(),
    turn: null,
    winner: null
  };
}

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
// 상태 전송
// =========================

function send(room) {
  if (!room) return;
  io.to(room.roomId).emit("stateUpdate", room);
}

// =========================
// 턴
// =========================

function nextTurn(room, id) {
  const idx = room.players.indexOf(id);
  room.turn = room.players[(idx + 1) % room.players.length];
}

// =========================
// 카드 플레이
// =========================

function play(room, playerId, card) {
  const hand = room.hands[playerId];
  if (!hand) return;

  const i = hand.indexOf(card);
  if (i === -1) return;

  hand.splice(i, 1);

  const month = card.split("_")[0];
  const match = room.table.find(c => c.split("_")[0] === month);

  if (match) {
    room.table = room.table.filter(c => c !== match);
    room.captured[playerId].push(card, match);
  } else {
    room.table.push(card);
  }

  if (room.deck.length > 0) {
    room.table.push(room.deck.pop());
  }

  nextTurn(room, playerId);
  send(room);
}

// =========================
// socket
// =========================

io.on("connection", socket => {

  console.log("connect", socket.id);

  // =====================
  // joinRoom (복구 핵심)
  // =====================

  socket.on("joinRoom", data => {

    const roomId = data.roomId;
    const name = data.name || "guest";

    let room = rooms[roomId];
    if (!room) room = createRoom(roomId);

    socket.join(roomId);

    // 기존 플레이어 유지 (중복 방지)
    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    room.names[socket.id] = name;

    // 🔥 재접속 복구 핵심
    if (!room.hands[socket.id]) {
      room.hands[socket.id] = [];
      room.captured[socket.id] = [];

      for (let i = 0; i < 10; i++) {
        room.hands[socket.id].push(room.deck.pop());
      }
    }

    if (!room.turn) {
      room.turn = room.players[0];
    }

    send(room);
  });

  // =====================
  // 카드 플레이
  // =====================

  socket.on("playCard", data => {

    const room = rooms[data.roomId];
    if (!room) return;

    if (room.turn !== socket.id) return;

    play(room, socket.id, data.card);
  });

  // =====================
  // disconnect (중요)
  // =====================

  socket.on("disconnect", () => {

    Object.values(rooms).forEach(room => {

      room.players = room.players.filter(p => p !== socket.id);

      // ⚠️ 삭제하지 않음 (재접속 대비 유지)
      // delete room.hands[socket.id];
      // delete room.captured[socket.id];
      // delete room.names[socket.id];

      if (room.players.length === 0) {
        delete rooms[room.roomId];
      }

      send(room);
    });
  });
});

server.listen(process.env.PORT || 10000, () => {
  console.log("server running");
});
