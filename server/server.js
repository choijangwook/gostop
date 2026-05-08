const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

console.log("🎴 Gostop 서버 실행중");

const rooms = {};

// =========================
// 카드 덱 생성
// =========================

function createDeck() {

  const cards = [

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

    "special1_draw.png",
    "special2_draw.png",
    "special3_draw.png"
  ];

  return shuffle(cards);
}

// =========================
// 셔플
// =========================

function shuffle(arr) {

  for (
    let i = arr.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [arr[i], arr[j]] =
      [arr[j], arr[i]];
  }

  return arr;
}

// =========================
// 월 추출
// =========================

function getMonth(card) {

  return card.split("_")[0];
}

// =========================
// 방 생성
// =========================

function createRoom(roomId) {

  const deck =
    createDeck();

  const room = {

    roomId,

    players: [],

    hands: {},

    captured: {},

    table: [],

    deck,

    turn: null,

    winner: null,

    lastCapture: false,

    bot: false
  };

  // 바닥패 8장
  for (let i = 0; i < 8; i++) {

    room.table.push(
      deck.pop()
    );
  }

  rooms[roomId] = room;

  return room;
}

// =========================
// 상태 전송
// =========================

function sendState(room) {

  room.deckCount =
    room.deck.length;

  io.to(room.roomId)
    .emit("stateUpdate", room);
}

// =========================
// 카드 플레이
// =========================

function playCard(
  room,
  playerId,
  card
) {

  room.lastCapture = false;

  const hand =
    room.hands[playerId];

  if (!hand)
    return;

  const idx =
    hand.indexOf(card);

  if (idx === -1)
    return;

  // 손패 제거
  hand.splice(idx, 1);

  const month =
    getMonth(card);

  // 같은 월 찾기
  const match =
    room.table.find(
      c =>
        getMonth(c)
        ===
        month
    );

  // =====================
  // 먹기 성공
  // =====================

  if (match) {

    room.table =
      room.table.filter(
        c => c !== match
      );

    room.captured[playerId]
      .push(card);

    room.captured[playerId]
      .push(match);

    room.lastCapture = true;

  } else {

    // 실패시 바닥
    room.table.push(card);
  }

  // =====================
  // 덱 드로우
  // =====================

  if (room.deck.length > 0) {

    const draw =
      room.deck.pop();

    const drawMonth =
      getMonth(draw);

    const drawMatch =
      room.table.find(
        c =>
          getMonth(c)
          ===
          drawMonth
      );

    if (drawMatch) {

      room.table =
        room.table.filter(
          c => c !== drawMatch
        );

      room.captured[playerId]
        .push(draw);

      room.captured[playerId]
        .push(drawMatch);

      room.lastCapture = true;

    } else {

      room.table.push(draw);
    }
  }

  // =====================
  // 턴 변경
  // =====================

  const currentIndex =
    room.players.indexOf(
      playerId
    );

  room.turn =
    room.players[
      (
        currentIndex + 1
      )
      %
      room.players.length
    ];

  // =====================
  // 게임 종료
  // =====================

  const end =
    Object.values(room.hands)
      .every(
        h => h.length === 0
      );

  if (end) {

    let best =
      room.players[0];

    room.players.forEach(p => {

      if (
        room.captured[p].length
        >
        room.captured[best].length
      ) {
        best = p;
      }
    });

    room.winner = best;
  }

  sendState(room);

  // =====================
  // 봇 턴
  // =====================

  if (
    room.bot &&
    room.turn === "BOT"
  ) {

    setTimeout(() => {

      botPlay(room);

    }, 800);
  }
}

// =========================
// 봇 플레이
// =========================

function botPlay(room) {

  const botHand =
    room.hands["BOT"];

  if (
    !botHand ||
    botHand.length === 0
  ) {
    return;
  }

  const card =
    botHand[0];

  playCard(
    room,
    "BOT",
    card
  );
}

// =========================
// 연결
// =========================

io.on("connection", socket => {

  console.log("접속:", socket.id);

  // =====================
  // 방 참가
  // =====================

  socket.on("joinRoom", data => {

    const roomId =
      String(data.roomId);

    let room =
      rooms[roomId];

    if (!room) {

      room =
        createRoom(roomId);
    }

    socket.join(roomId);

    // 중복 방지
    if (
      !room.players.includes(
        socket.id
      )
    ) {

      room.players.push(
        socket.id
      );
    }

    // 손패 생성
    if (
      !room.hands[socket.id]
    ) {

      room.hands[socket.id] =
        [];

      room.captured[socket.id] =
        [];

      // 초기패 10장
      for (
        let i = 0;
        i < 10;
        i++
      ) {

        room.hands[socket.id]
          .push(
            room.deck.pop()
          );
      }
    }

    // =====================
    // 컴퓨터 대결
    // =====================

    if (
      data.bot &&
      !room.bot
    ) {

      room.bot = true;

      room.players.push("BOT");

      room.hands["BOT"] =
        [];

      room.captured["BOT"] =
        [];

      for (
        let i = 0;
        i < 10;
        i++
      ) {

        room.hands["BOT"]
          .push(
            room.deck.pop()
          );
      }
    }

    // 첫 턴
    if (!room.turn) {

      room.turn =
        room.players[0];
    }

    sendState(room);
  });

  // =====================
  // 카드 플레이
  // =====================

  socket.on("playCard", data => {

    const room =
      rooms[data.roomId];

    if (!room)
      return;

    // 자기 턴만
    if (
      String(room.turn)
      !==
      String(socket.id)
    ) {
      return;
    }

    playCard(
      room,
      socket.id,
      data.card
    );
  });

  // =====================
  // 종료
  // =====================

  socket.on("disconnect", () => {

    Object.values(rooms)
      .forEach(room => {

        room.players =
          room.players.filter(
            p =>
              p !== socket.id
          );

        delete room.hands[
          socket.id
        ];

        delete room.captured[
          socket.id
        ];

        if (
          room.turn
          ===
          socket.id
        ) {

          room.turn =
            room.players[0]
            || null;
        }

        sendState(room);
      });
  });
});

// =========================
// 서버 시작
// =========================

server.listen(
  process.env.PORT || 10000,
  () => {

    console.log(
      "포트 10000 실행중"
    );
  }
);
