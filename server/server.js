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
// deck
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
// room create
// =========================

function createRoom(roomId) {

  const deck = createDeck();

  return {
    roomId: String(roomId),
    players: [],
    roles: {},        // socket.id -> A/B
    hands: {},
    captured: {},
    table: deck.splice(0, 8),
    deck,
    turn: "A",
    winner: null
  };
}

// =========================
// send state
// =========================

function send(room) {

  io.to(room.roomId).emit("stateUpdate", {
    roomId: room.roomId,
    players: room.players,
    roles: room.roles,
    hands: room.hands,
    captured: room.captured,
    table: room.table,
    deck: room.deck,
    turn: room.turn,
    winner: room.winner
  });
}

// =========================
// turn switch
// =========================

function nextTurn(room) {
  room.turn = room.turn === "A" ? "B" : "A";
}

// =========================
// play logic
// =========================

function play(room, playerId, card) {

  playerId = String(playerId);

  const hand = room.hands[playerId];
  if (!hand) return;

  const idx = hand.indexOf(card);
  if (idx === -1) return;

  hand.splice(idx, 1);

  const month = card.split("_")[0];

  const match = room.table.find(c => c.split("_")[0] === month);

  if (match) {
    room.table = room.table.filter(c => c !== match);
    room.captured[playerId].push(card);
    room.captured[playerId].push(match);
  } else {
    room.table.push(card);
  }

  if (room.deck.length > 0) {
    room.table.push(room.deck.pop());
  }

  nextTurn(room);

  send(room);
}

// =========================
// socket
// =========================

io.on("connection", socket => {

  // =========================
  // join
  // =========================
  socket.on("joinRoom", data => {

    const roomId = String(data.roomId);

    let room = rooms[roomId];
    if (!room) room = createRoom(roomId);

    socket.join(roomId);

    // player add
    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    // role fix (핵심 안정화)
    if (!room.roles[socket.id]) {
      room.roles[socket.id] =
        room.players.length === 1 ? "A" : "B";
    }

    // hands init
    if (!room.hands[socket.id]) {
      room.hands[socket.id] = [];
      room.captured[socket.id] = [];

      for (let i = 0; i < 10; i++) {
        room.hands[socket.id].push(room.deck.pop());
      }
    }

    // turn 초기값 고정 (절대 socket.id 금지)
    if (room.players.length === 1) {
      room.turn = "A";
    }

    rooms[roomId] = room;

    send(room);
  });

  // =========================
  // play card
  // =========================
  socket.on("playCard", data => {

    const room = rooms[data.roomId];
    if (!room) return;

    // 🔥 핵심: role 기준 비교
    if (room.roles[socket.id] !== room.turn) return;

    play(room, socket.id, data.card);
  });

  // =========================
  // restart
  // =========================
  socket.on("restart", data => {

    const room = rooms[data.roomId];
    if (!room) return;

    const deck = createDeck();

    room.deck = deck;
    room.table = deck.splice(0, 8);
    room.hands = {};
    room.captured = {};
    room.turn = "A";
    room.winner = null;

    // role 유지 + 재분배
    room.players.forEach((id, index) => {

      room.roles[id] = index === 0 ? "A" : "B";

      room.hands[id] = [];
      room.captured[id] = [];

      for (let i = 0; i < 10; i++) {
        room.hands[id].push(room.deck.pop());
      }
    });

    send(room);
  });

  // =========================
  // leave
  // =========================
  socket.on("leaveRoom", data => {

    const roomId = data.roomId;
    const room = rooms[roomId];
    if (!room) return;

    const id = socket.id;

    room.players = room.players.filter(p => p !== id);

    delete room.roles[id];
    delete room.hands[id];
    delete room.captured[id];

    socket.leave(roomId);

    if (room.players.length === 0) {
      delete rooms[roomId];
      return;
    }

    room.turn = "A";

    send(room);
  });

});

server.listen(10000, () => {
  console.log("server running");
});
