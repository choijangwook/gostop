const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*" }
});

app.use(express.static("docs"));

// =========================
// 🎴 정확한 덱 (48장)
// =========================
function createDeck() {

  const deck = [

    "1_bright.png","1_ribbon.png","1_junk1.png","1_junk2.png",

    "2_animal.png","2_ribbon.png","2_junk1.png","2_junk2.png",

    "3_bright.png","3_ribbon.png","3_junk1.png","3_junk2.png",

    "4_animal.png","4_ribbon.png","4_junk1.png","4_junk2.png",

    "5_animal.png","5_ribbon.png","5_junk1.png","5_junk2.png",

    "6_animal.png","6_ribbon.png","6_junk1.png","6_junk2.png",

    "7_animal.png","7_ribbon.png","7_junk1.png","7_junk2.png",

    "8_bright.png","8_animal.png","8_junk1.png","8_junk2.png",

    "9_animal.png","9_ribbon.png","9_junk1.png","9_junk2.png",

    "10_animal.png","10_ribbon.png","10_junk1.png","10_junk2.png",

    "11_bright.png","11_junk1.png","11_junk2.png","11_junk3.png",

    "12_bright.png","12_animal.png","12_ribbon.png","12_junk1.png"
  ];

  return deck.sort(() => Math.random() - 0.5);
}

// =========================
const rooms = {};

// =========================
function emitState(roomId) {

  const room = rooms[roomId];
  if (!room) return;

  io.to(roomId).emit("stateUpdate", {
    roomId,
    table: room.table,
    hands: room.hands,
    captured: room.captured
  });
}

// =========================
io.on("connection", (socket) => {

  socket.on("joinRoom", ({ roomId }) => {

    roomId = Number(roomId);

    if (!rooms[roomId]) {

      const deck = createDeck();

      rooms[roomId] = {
        players: [],
        table: deck.splice(0, 6),
        deck,
        hands: {},
        captured: {},
        selectedHand: {}
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
  socket.on("selectHand", ({ roomId, card }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.selectedHand[socket.id] = card;
  });

  // =========================
  socket.on("takeCard", ({ roomId, tableCard }) => {

    const room = rooms[roomId];
    if (!room) return;

    const selected = room.selectedHand[socket.id];
    if (!selected) return;

    const ti = room.table.indexOf(tableCard);
    if (ti === -1) return;

    const hand = room.hands[socket.id];
    const hi = hand.indexOf(selected);

    if (hi !== -1) hand.splice(hi, 1);

    room.table.splice(ti, 1);

    room.captured[socket.id].push(tableCard);

    room.selectedHand[socket.id] = null;

    emitState(roomId);
  });

});

server.listen(10000, () => {
  console.log("server running");
});
