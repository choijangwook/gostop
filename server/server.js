const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 10000;

app.use(express.static("docs"));

/* =========================
   덱 생성
========================= */

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
    "12_bright.png","12_animal.png","12_ribbon.png","12_junk1.png",

    "special1_draw.png",
    "special2_draw.png",
    "special3_draw.png"
  ];

  return deck.sort(() => Math.random() - 0.5);
}

/* =========================
   방 저장
========================= */

const rooms = {};

/* =========================
   상태 전송 (핵심 수정)
========================= */

function emitState(roomId) {

  const room = rooms[roomId];

  if (!room) return;

  io.to(roomId).emit("stateUpdate", {

    roomId: roomId,   // 🔥 핵심: 반드시 포함

    players: room.players,

    table: room.table,

    hands: room.hands,

    captured: room.captured,

    turn: room.turn,

    deckCount: room.deck.length,

    gameOver: room.gameOver || false,

    winner: room.winner || null
  });
}

/* =========================
   서버
========================= */

io.on("connection", (socket) => {

  console.log("접속:", socket.id);

  /* =======================
     방 참가
  ======================= */

  socket.on("joinRoom", (data) => {

    const roomId = data.roomId;

    socket.join(roomId);

    if (!rooms[roomId]) {

      const deck = createDeck();

      rooms[roomId] = {

        players: [],

        table: [],

        hands: {},

        captured: {},

        deck: deck,

        turn: null
      };

      // 초기 바닥패 8장

      for (let i = 0; i < 8; i++) {
        rooms[roomId].table.push(deck.pop());
      }
    }

    const room = rooms[roomId];

    if (!room.players.includes(socket.id)) {

      room.players.push(socket.id);

      room.hands[socket.id] = [];

      room.captured[socket.id] = [];

      // 초기 7장 지급

      for (let i = 0; i < 7; i++) {
        room.hands[socket.id].push(room.deck.pop());
      }
    }

    if (!room.turn) {
      room.turn = socket.id;
    }

    emitState(roomId);
  });

  /* =======================
     카드 플레이
  ======================= */

  socket.on("playCard", (data) => {

    const room = rooms[data.roomId];

    if (!room) return;

    if (room.turn !== socket.id) return;

    const hand = room.hands[socket.id];

    const card = data.card;

    const idx = hand.indexOf(card);

    if (idx === -1) return;

    hand.splice(idx, 1);

    room.table.push(card);

    // 턴 변경

    const idxP = room.players.indexOf(socket.id);

    room.turn =
      room.players[
        (idxP + 1) % room.players.length
      ];

    emitState(data.roomId);
  });

});

/* =========================
   실행
========================= */

server.listen(PORT, () => {

  console.log("🎴 Gostop 서버 실행중");

  console.log("포트:", PORT);
});
