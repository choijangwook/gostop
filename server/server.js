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
// 카드 덱 생성
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
// socket
// =========================
io.on("connection", (socket) => {

  console.log("connect:", socket.id);

  socket.on("joinRoom", ({ roomId }) => {

    roomId = Number(roomId);

    // 방 없으면 생성
    if (!rooms[roomId]) {
      const deck = createDeck();

      rooms[roomId] = {
        players: [],
        table: deck.splice(0, 6),
        deck,
        hands: {}
      };
    }

    const room = rooms[roomId];

    socket.join(roomId);

    // 플레이어 추가
    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    // 🔥 카드 분배 (처음 들어온 사람만)
    if (!room.hands[socket.id]) {
      room.hands[socket.id] = room.deck.splice(0, 5);
    }

    io.to(roomId).emit("stateUpdate", {
      roomId,
      players: room.players,
      table: room.table,
      hands: room.hands
    });
  });

});

server.listen(10000, () => {
  console.log("server running");
});
