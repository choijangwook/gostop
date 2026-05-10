const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "../docs")));

const io = new Server(server, { cors: { origin: "*" } });

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
// score system
// =========================

function calcScore(cards) {
  let gwang = 0, pi = 0, ddi = 0;

  cards.forEach(c => {
    if (c.includes("bright")) gwang++;
    else if (c.includes("ribbon")) ddi++;
    else pi++;
  });

  return { gwang, pi, ddi, total: gwang * 3 + ddi * 2 + pi };
}

// =========================
// room
// =========================

function createRoom(roomId) {
  const deck = createDeck();

  return {
    roomId,
    players: [],
    roles: {},
    turn: "A",
    deck,
    table: deck.splice(0, 8),
    hands: {},
    captured: {},
    gameOver: false,
    winner: null,
    timer: null
  };
}

// =========================
// send
// =========================

function send(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  io.to(roomId).emit("stateUpdate", room);
}

// =========================
// bot AI (simple + valid move)
// =========================

function botPlay(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.turn !== "B") return;

  setTimeout(() => {
    const hand = room.hands["BOT"] || [];
    if (!hand.length) return;

    const card = hand[Math.floor(Math.random() * hand.length)];

    play(roomId, "BOT", card);
  }, 700);
}

// =========================
// play logic
// =========================

function play(roomId, socketId, card) {
  const room = rooms[roomId];
  if (!room) return;

  const role = room.roles[socketId];
  if (role !== room.turn) return;

  const hand = room.hands[socketId];
  const idx = hand.indexOf(card);
  if (idx === -1) return;

  hand.splice(idx, 1);

  const month = card.split("_")[0];
  const matchIndex = room.table.findIndex(c => c.split("_")[0] === month);

  if (matchIndex !== -1) {
    const match = room.table.splice(matchIndex, 1)[0];
    room.captured[socketId].push(card, match);
  } else {
    room.table.push(card);
  }

  if (room.deck.length > 0) {
    room.table.push(room.deck.pop());
  }

  room.turn = room.turn === "A" ? "B" : "A";

  send(roomId);

  botPlay(roomId);
}

// =========================
// restart
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

  room.players.forEach((id, i) => {
    room.roles[id] = i === 0 ? "A" : "B";

    room.hands[id] = [];
    room.captured[id] = [];

    for (let j = 0; j < 10; j++) {
      room.hands[id].push(room.deck.pop());
    }
  });

  send(roomId);
}

// =========================
// socket
// =========================

io.on("connection", socket => {

  socket.on("joinRoom", ({ roomId }) => {

    if (!rooms[roomId]) {
      rooms[roomId] = createRoom(roomId);
    }

    const room = rooms[roomId];

    socket.join(roomId);

    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    room.roles[socket.id] =
      room.players.length === 1 ? "A" : "B";

    if (!room.hands[socket.id]) {
      room.hands[socket.id] = [];
      room.captured[socket.id] = [];

      for (let i = 0; i < 10; i++) {
        room.hands[socket.id].push(room.deck.pop());
      }
    }

    send(roomId);
  });

  socket.on("playCard", ({ roomId, card }) => {
    play(roomId, socket.id, card);
  });

  socket.on("restartGame", (roomId) => {
    restart(roomId);
  });

  socket.on("leaveRoom", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(id => id !== socket.id);

    delete room.roles[socket.id];
    delete room.hands[socket.id];
    delete room.captured[socket.id];

    send(roomId);
  });

});

server.listen(10000, "0.0.0.0", () => {
  console.log("server running");
});
