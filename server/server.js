const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const ROOMS_FILE = "rooms.json";

let rooms = {};

// =========================
// 저장/로드
// =========================

function saveRooms() {
  try {
    fs.writeFileSync(
      ROOMS_FILE,
      JSON.stringify(rooms, null, 2)
    );
  } catch (e) {}
}

function loadRooms() {
  try {
    const data = fs.readFileSync(ROOMS_FILE);
    rooms = JSON.parse(data);
  } catch (e) {
    rooms = {};
  }
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
    winner: null
  };

  for (let i = 0; i < 8; i++) {
    room.table.push(deck.pop());
  }

  rooms[roomId] = room;
  saveRooms();

  return room;
}

// =========================
// 상태
// =========================

function sendState(room) {
  io.to(room.roomId).emit("stateUpdate", room);
  saveRooms();
}

// =========================
// 게임 로직
// =========================

function nextTurn(room, playerId) {
  const idx = room.players.indexOf(playerId);
  room.turn = room.players[(idx + 1) % room.players.length];
}

function playCard(room, playerId, card) {
  const hand = room.hands[playerId];
  if (!hand) return;

  const idx = hand.indexOf(card);
  if (idx === -1) return;

  hand.splice(idx, 1);

  const month = card.split("_")[0];

  const match = room.table.find(
    c => c.split("_")[0] === month
  );

  if (match) {
    room.table = room.table.filter(c => c !== match);
    room.captured[playerId].push(card, match);
  } else {
    room.table.push(card);
  }

  if (room.deck.length > 0) {
    const draw = room.deck.pop();
    room.table.push(draw);
  }

  nextTurn(room, playerId);
  sendState(room);
}

// =========================
// socket
// =========================

io.on("connection", socket => {

  socket.on("joinRoom", (roomId) => {

    let room = rooms[roomId];
    if (!room) room = createRoom(roomId);

    socket.join(roomId);

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

    sendState(room);
  });

  socket.on("playCard", ({ roomId, card }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (room.turn !== socket.id) return;

    playCard(room, socket.id, card);
  });

  socket.on("disconnect", () => {
    Object.values(rooms).forEach(room => {
      room.players = room.players.filter(p => p !== socket.id);
    });
  });
});

loadRooms();

server.listen(process.env.PORT || 10000, () => {
  console.log("server running");
});
