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
   카드 생성
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
   방
========================= */

const rooms = {};

/* =========================
   월 추출
========================= */

function getMonth(card) {

  return Number(card.split("_")[0]);
}

/* =========================
   점수 계산
========================= */

function calculateScore(cards) {

  let bright = 0;
  let animal = 0;
  let ribbon = 0;
  let junk = 0;

  cards.forEach(card => {

    if (card.includes("bright"))
      bright++;

    else if (card.includes("animal"))
      animal++;

    else if (card.includes("ribbon"))
      ribbon++;

    else
      junk++;
  });

  let score = 0;

  // 광

  if (bright >= 5)
    score += 15;

  else if (bright === 4)
    score += 4;

  else if (bright === 3)
    score += 3;

  // 띠

  if (ribbon >= 5)
    score += ribbon - 4;

  // 열끗

  if (animal >= 5)
    score += animal - 4;

  // 피

  if (junk >= 10)
    score += junk - 9;

  return score;
}

/* =========================
   상태 전송
========================= */

function emitState(roomId) {

  const room = rooms[roomId];

  if (!room) return;

  const scores = {};

  room.players.forEach(pid => {

    scores[pid] =
      calculateScore(
        room.captured[pid]
      );
  });

  io.to(roomId).emit("stateUpdate", {

    roomId,

    players: room.players,

    table: room.table,

    hands: room.hands,

    captured: room.captured,

    turn: room.turn,

    deckCount: room.deck.length,

    scores,

    goCount: room.goCount || {},

    gameOver: room.gameOver || false,

    winner: room.winner || null
  });
}

/* =========================
   게임 종료 검사
========================= */

function checkGameEnd(roomId, playerId) {

  const room = rooms[roomId];

  const cards =
    room.captured[playerId];

  const score =
    calculateScore(cards);

  // 3점 이상

  if (score >= 3) {

    room.askingGoStop =
      playerId;

    io.to(playerId)
      .emit("askGoStop", {
        score
      });
  }
}

/* =========================
   다음 턴
========================= */

function nextTurn(room) {

  const idx =
    room.players.indexOf(room.turn);

  room.turn =
    room.players[
      (idx + 1) % room.players.length
    ];
}

/* =========================
   입장
========================= */

io.on("connection", socket => {

  console.log("접속:", socket.id);

  /* =====================
     방 참가
  ===================== */

  socket.on("joinRoom", data => {

    const roomId = data.roomId;

    socket.join(roomId);

    if (!rooms[roomId]) {

      const deck = createDeck();

      rooms[roomId] = {

        players: [],

        table: [],

        hands: {},

        captured: {},

        deck,

        turn: null,

        goCount: {},

        gameOver: false,

        winner: null
      };

      // 바닥 8장

      for (let i = 0; i < 8; i++) {

        rooms[roomId]
          .table
          .push(deck.pop());
      }
    }

    const room = rooms[roomId];

    // 중복 방지

    if (
      room.players.includes(socket.id)
    ) return;

    // 플레이어 추가

    room.players.push(socket.id);

    room.hands[socket.id] = [];

    room.captured[socket.id] = [];

    room.goCount[socket.id] = 0;

    // 7장 지급

    for (let i = 0; i < 7; i++) {

      room.hands[socket.id]
        .push(room.deck.pop());
    }

    // 첫턴

    if (!room.turn)
      room.turn = socket.id;

    emitState(roomId);
  });

  /* =====================
     카드 플레이
  ===================== */

  socket.on("playCard", data => {

    const room =
      rooms[data.roomId];

    if (!room) return;

    // 턴 체크

    if (room.turn !== socket.id)
      return;

    const hand =
      room.hands[socket.id];

    const card =
      data.card;

    const idx =
      hand.indexOf(card);

    if (idx === -1)
      return;

    hand.splice(idx, 1);

    const month =
      getMonth(card);

    const matched =
      room.table.filter(
        c => getMonth(c) === month
      );

    // 먹기

    if (matched.length > 0) {

      matched.forEach(m => {

        room.table.splice(
          room.table.indexOf(m),
          1
        );

        room.captured[socket.id]
          .push(m);
      });

      room.captured[socket.id]
        .push(card);
    }

    // 못먹음

    else {

      room.table.push(card);
    }

    // 덱 드로우

    if (room.deck.length > 0) {

      const draw =
        room.deck.pop();

      const drawMonth =
        getMonth(draw);

      const drawMatched =
        room.table.filter(
          c => getMonth(c) === drawMonth
        );

      if (drawMatched.length > 0) {

        drawMatched.forEach(m => {

          room.table.splice(
            room.table.indexOf(m),
            1
          );

          room.captured[socket.id]
            .push(m);
        });

        room.captured[socket.id]
          .push(draw);
      }

      else {

        room.table.push(draw);
      }
    }

    // 게임 종료 검사

    checkGameEnd(
      data.roomId,
      socket.id
    );

    // 턴 넘김

    nextTurn(room);

    emitState(data.roomId);
  });

  /* =====================
     고
  ===================== */

  socket.on("go", roomId => {

    const room =
      rooms[roomId];

    if (!room) return;

    room.goCount[socket.id]++;

    room.askingGoStop = null;

    emitState(roomId);
  });

  /* =====================
     스톱
  ===================== */

  socket.on("stop", roomId => {

    const room =
      rooms[roomId];

    if (!room) return;

    room.gameOver = true;

    room.winner = socket.id;

    emitState(roomId);
  });

  /* =====================
     연결 종료
  ===================== */

  socket.on("disconnect", () => {

    Object.keys(rooms)
      .forEach(roomId => {

        const room =
          rooms[roomId];

        room.players =
          room.players.filter(
            p => p !== socket.id
          );

        delete room.hands[socket.id];

        delete room.captured[socket.id];

        emitState(roomId);
      });
  });
});

server.listen(PORT, () => {

  console.log("🎴 Gostop 서버 실행중");

  console.log("포트", PORT, "실행중");
});
