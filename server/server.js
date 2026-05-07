const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*"
  }
});

app.use(express.static("docs"));

// =========================
// 정확한 화투 48장
// =========================
function createDeck() {

  const deck = [

    "1_bright.png",
    "1_ribbon.png",
    "1_junk1.png",
    "1_junk2.png",

    "2_animal.png",
    "2_ribbon.png",
    "2_junk1.png",
    "2_junk2.png",

    "3_bright.png",
    "3_ribbon.png",
    "3_junk1.png",
    "3_junk2.png",

    "4_animal.png",
    "4_ribbon.png",
    "4_junk1.png",
    "4_junk2.png",

    "5_animal.png",
    "5_ribbon.png",
    "5_junk1.png",
    "5_junk2.png",

    "6_animal.png",
    "6_ribbon.png",
    "6_junk1.png",
    "6_junk2.png",

    "7_animal.png",
    "7_ribbon.png",
    "7_junk1.png",
    "7_junk2.png",

    "8_bright.png",
    "8_animal.png",
    "8_junk1.png",
    "8_junk2.png",

    "9_animal.png",
    "9_ribbon.png",
    "9_junk1.png",
    "9_junk2.png",

    "10_animal.png",
    "10_ribbon.png",
    "10_junk1.png",
    "10_junk2.png",

    "11_bright.png",
    "11_junk1.png",
    "11_junk2.png",
    "11_junk3.png",

    "12_bright.png",
    "12_animal.png",
    "12_ribbon.png",
    "12_junk1.png",

    // 특수카드 3장
    "special1_draw.png",
    "special2_draw.png",
    "special3_draw.png"
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

  console.log("접속:", socket.id);

  // =========================
  // 방 참가
  // =========================
  socket.on("joinRoom", ({ roomId }) => {

    roomId = Number(roomId);

    if (!rooms[roomId]) {

      const deck = createDeck();

      rooms[roomId] = {
        players: [],
        table: deck.splice(0, 6),
        deck,
        hands: {},
        captured: {}
      };
    }

    const room = rooms[roomId];

    socket.join(roomId);

    // 중복 방지
    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    // 처음 참가 시만 패 지급
    if (!room.hands[socket.id]) {
      room.hands[socket.id] = room.deck.splice(0, 5);
    }

    if (!room.captured[socket.id]) {
      room.captured[socket.id] = [];
    }

    emitState(roomId);
  });

  // =========================
  // 카드 플레이
  // =========================
  socket.on("playCard", ({ roomId, card }) => {

    const room = rooms[roomId];
    if (!room) return;

    const hand = room.hands[socket.id];
    if (!hand) return;

    // 손패 제거
    const handIndex = hand.indexOf(card);

    if (handIndex === -1) return;

    hand.splice(handIndex, 1);

    // =========================
    // 특수카드 처리
    // =========================
    if (card.startsWith("special")) {

      room.captured[socket.id].push(card);

      const drawCard = room.deck.shift();

      if (drawCard) {
        hand.push(drawCard);
      }

      emitState(roomId);
      return;
    }

    // =========================
    // 월(month) 추출
    // =========================
    const month = card.split("_")[0];

    // =========================
    // 같은 월 찾기
    // =========================
    const matchIndex = room.table.findIndex(
      c => c.startsWith(month + "_")
    );

    // =========================
    // 먹기 성공
    // =========================
    if (matchIndex !== -1) {

      const matchedCard =
        room.table.splice(matchIndex, 1)[0];

      room.captured[socket.id].push(card);
      room.captured[socket.id].push(matchedCard);

    } else {

      // =========================
      // 못 먹으면 테이블로
      // =========================
      room.table.push(card);
    }

    emitState(roomId);
  });

  // =========================
  // 연결 종료
  // =========================
  socket.on("disconnect", () => {

    for (const roomId in rooms) {

      const room = rooms[roomId];

      room.players =
        room.players.filter(id => id !== socket.id);

      delete room.hands[socket.id];
      delete room.captured[socket.id];

      // 방 비면 삭제
      if (room.players.length === 0) {
        delete rooms[roomId];
      }
    }

    console.log("퇴장:", socket.id);
  });

});

// =========================
server.listen(10000, () => {
  console.log("🎴 Gostop 서버 실행중");
});
