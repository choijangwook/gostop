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
// room
// =========================

function createRoom(roomId) {

  const deck = createDeck();

  const room = {
    roomId: String(roomId),
    players: [],
    hands: {},
    captured: {},
    table: deck.splice(0, 8),
    deck,
    turn: null,
    winner: null
  };

  return room;
}

// =========================
// send state (핵심 fix)
// =========================

function send(room) {

  if (!room) return;

  io.to(room.roomId).emit("stateUpdate", {
    roomId: room.roomId,
    players: room.players,
    hands: room.hands,
    captured: room.captured,
    table: room.table,
    deck: room.deck,
    turn: String(room.turn),
    winner: room.winner
  });
}

// =========================
// next turn
// =========================

function nextTurn(room, id) {

  const idx = room.players.indexOf(String(id));

  room.turn =
    room.players[(idx + 1) % room.players.length];

  room.turn = String(room.turn);
}

// =========================
// play
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

  nextTurn(room, playerId);

  send(room);
}

// =========================
// socket
// =========================

io.on("connection", socket => {

  socket.on("joinRoom", data => {

    const roomId = String(data.roomId);

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

    if (!room.turn) {
      room.turn = String(room.players[0]);
    }

    rooms[roomId] = room;

    send(room);
  });

  socket.on("playCard", data => {

    const room = rooms[data.roomId];
    if (!room) return;

    if (String(room.turn) !== String(socket.id)) return;

    play(room, socket.id, data.card);
  });
});

server.listen(10000, () => {
  console.log("server running");
});
