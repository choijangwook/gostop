const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// static
app.use(express.static(path.join(__dirname, "../docs")));

const rooms = {};

// deck
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

function createGame(players) {
  const deck = createDeck();

  const hands = {};
  const captured = {};
  const roles = {};

  players.forEach((id, idx) => {
    roles[id] = idx === 0 ? "A" : "B";
    hands[id] = [];
    captured[id] = [];
  });

  players.forEach(id => {
    for (let i = 0; i < 10; i++) {
      hands[id].push(deck.pop());
    }
  });

  return {
    players,
    roles,
    hands,
    captured,
    table: deck.splice(0, 8),
    deck,
    turn: "A",
    winner: null
  };
}

function send(room) {
  io.to(room.id).emit("stateUpdate", room);
}

function nextTurn(room) {
  room.turn = room.turn === "A" ? "B" : "A";
}

function play(room, id, card) {
  const hand = room.hands[id];
  if (!hand) return;

  const idx = hand.indexOf(card);
  if (idx === -1) return;

  hand.splice(idx, 1);

  const month = card.split("_")[0];
  const match = room.table.find(c => c.split("_")[0] === month);

  if (match) {
    room.table = room.table.filter(c => c !== match);
    room.captured[id].push(card, match);
  } else {
    room.table.push(card);
  }

  if (room.deck.length) {
    room.table.push(room.deck.pop());
  }

  nextTurn(room);
  send(room);
}

io.on("connection", socket => {

  socket.on("joinRoom", ({ roomId }) => {

    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        players: [],
        roles: {},
        hands: {},
        captured: {},
        table: [],
        deck: [],
        turn: "A"
      };
    }

    const room = rooms[roomId];

    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    if (room.players.length >= 2 && !room._started) {
      const newGame = createGame(room.players);
      rooms[roomId] = newGame;
      rooms[roomId].id = roomId;
      rooms[roomId]._started = true;
    }

    send(rooms[roomId]);
  });

  socket.on("playCard", ({ roomId, card }) => {
    const room = rooms[roomId];
    if (!room) return;

    const role = room.roles[socket.id];
    if (role !== room.turn) return;

    play(room, socket.id, card);
  });

  socket.on("restart", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    rooms[roomId] = createGame(room.players);
    rooms[roomId].id = roomId;

    send(rooms[roomId]);
  });

});

server.listen(10000, "0.0.0.0", () => {
  console.log("server running");
  console.log("http://192.168.219.103:10000");
});
