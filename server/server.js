const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "../docs")));

const io = new Server(server, {
  cors: { origin: "*" }
});

// =========================
// rooms
// =========================

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
// room factory
// =========================

function createRoom(roomId) {
  const deck = createDeck();

  return {
    roomId,
    players: [],
    roles: {},        // socketId -> A/B
    turn: "A",
    deck,
    table: deck.splice(0, 8),
    hands: {},
    captured: {},
    gameOver: false,
    winner: null
  };
}

// =========================
// helper
// =========================

function send(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  io.to(roomId).emit("stateUpdate", room);
}

// =========================
// restart (핵심 안정화)
// =========================

function restart(roomId) {

  const room = rooms[roomId];
  if (!room) return;

  const deck = createDeck();

  room.deck = deck;
  room.table = deck.splice(0, 8);
  room.hands = {};
  room.captured = {};
  room.turn = "A";
  room.gameOver = false;
  room.winner = null;

  room.players.forEach((id, idx) => {

    room.roles[id] = idx === 0 ? "A" : "B";

    room.hands[id] = [];
    room.captured[id] = [];

    for (let i = 0; i < 10; i++) {
      room.hands[id].push(room.deck.pop());
    }
  });

  send(roomId);
}

// =========================
// play card
// =========================

function play(roomId, socketId, card) {

  const room = rooms[roomId];
  if (!room) return;

  const role = room.roles[socketId];
  if (role !== room.turn) return;

  const hand = room.hands[socketId];
  if (!hand) return;

  const idx = hand.indexOf(card);
  if (idx === -1) return;

  hand.splice(idx, 1);

  const month = card.split("_")[0];

  const matchIndex = room.table.findIndex(c =>
    c.split("_")[0] === month
  );

  if (matchIndex !== -1) {

    const match = room.table.splice(matchIndex, 1)[0];

    room.captured[socketId].push(card);
    room.captured[socketId].push(match);

  } else {
    room.table.push(card);
  }

  if (room.deck.length > 0) {
    room.table.push(room.deck.pop());
  }

  room.turn = room.turn === "A" ? "B" : "A";

  send(roomId);
}

// =========================
// socket
// =========================

io.on("connection", socket => {

  // join
  socket.on("joinRoom", ({ roomId }) => {

    if (!rooms[roomId]) {
      rooms[roomId] = createRoom(roomId);
    }

    const room = rooms[roomId];

    socket.join(roomId);

    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    if (!room.roles[socket.id]) {
      room.roles[socket.id] =
        room.players.length === 1 ? "A" : "B";
    }

    if (!room.hands[socket.id]) {

      room.hands[socket.id] = [];
      room.captured[socket.id] = [];

      for (let i = 0; i < 10; i++) {
        room.hands[socket.id].push(room.deck.pop());
      }
    }

    send(roomId);
  });

  // play
  socket.on("playCard", ({ roomId, card }) => {
    play(roomId, socket.id, card);
  });

  // restart
  socket.on("restartGame", (roomId) => {
    restart(roomId);
  });

  // leave
  socket.on("leaveRoom", ({ roomId }) => {

    const room = rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(id => id !== socket.id);

    delete room.roles[socket.id];
    delete room.hands[socket.id];
    delete room.captured[socket.id];

    if (room.players.length === 0) {
      delete rooms[roomId];
      return;
    }

    send(roomId);
  });

  // disconnect
  socket.on("disconnect", () => {

    Object.keys(rooms).forEach(roomId => {

      const room = rooms[roomId];
      if (!room) return;

      room.players = room.players.filter(id => id !== socket.id);

      delete room.roles[socket.id];
      delete room.hands[socket.id];
      delete room.captured[socket.id];

      if (room.players.length === 0) {
        delete rooms[roomId];
      } else {
        send(roomId);
      }
    });
  });
});

// =========================
// start
// =========================

server.listen(10000, "0.0.0.0", () => {
  console.log("server running");
});
