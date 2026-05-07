// server/server.js

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

const rooms = {};

console.log("🎴 Gostop 서버 실행중");


// =========================
// 카드 생성
// =========================
function createCards() {

  const cards = [];

  let id = 0;

  for (let month = 1; month <= 12; month++) {

    cards.push({
      id: id++,
      month,
      file: `${month}_junk1.png`
    });

    cards.push({
      id: id++,
      month,
      file: `${month}_junk2.png`
    });

    cards.push({
      id: id++,
      month,
      file: `${month}_animal.png`
    });

    cards.push({
      id: id++,
      month,
      file: `${month}_ribbon.png`
    });
  }

  // 셔플
  return cards.sort(() => Math.random() - 0.5);
}


// =========================
// 숫자 3자리 방번호
// =========================
function generateRoomId() {

  let roomId;

  do {

    roomId =
      Math.floor(
        100 + Math.random() * 900
      ).toString();

  } while (rooms[roomId]);

  return roomId;
}


// =========================
// 상태 전송
// =========================
function sendState(roomId) {

  const room = rooms[roomId];

  if (!room) return;

  // host
  io.to(room.host).emit("updateState", {

    myHand: room.hostHand,

    table: room.table,

    capture: room.hostCapture,

    opponentCapture: room.guestCapture,

    turn: room.turn
  });

  // guest
  if (room.guest) {

    io.to(room.guest).emit("updateState", {

      myHand: room.guestHand,

      table: room.table,

      capture: room.guestCapture,

      opponentCapture: room.hostCapture,

      turn: room.turn
    });
  }
}


// =========================
// 연결
// =========================
io.on("connection", (socket) => {

  console.log("접속:", socket.id);


  // =========================
  // 방 만들기
  // =========================
  socket.on("createRoom", () => {

    const roomId = generateRoomId();

    const deck = createCards();

    rooms[roomId] = {

      host: socket.id,

      guest: null,

      turn: socket.id,

      hostHand: deck.splice(0, 10),

      guestHand: deck.splice(0, 10),

      table: deck.splice(0, 8),

      hostCapture: [],

      guestCapture: []
    };

    socket.join(roomId);

    console.log("방 생성:", roomId);

    socket.emit("roomCreated", roomId);
  });


  // =========================
  // 방 참가
  // =========================
  socket.on("joinRoom", (roomId) => {

    console.log("참가 요청:", roomId);

    const room = rooms[roomId];

    if (!room) {

      socket.emit(
        "errorMessage",
        "존재하지 않는 방입니다."
      );

      return;
    }

    if (room.guest) {

      socket.emit(
        "errorMessage",
        "방이 가득 찼습니다."
      );

      return;
    }

    room.guest = socket.id;

    socket.join(roomId);

    console.log("게임 시작:", roomId);

    setTimeout(() => {

      io.to(roomId).emit("startGame");

      sendState(roomId);

    }, 300);
  });


  // =========================
  // 카드 플레이
  // =========================
  socket.on("playCard", ({ roomId, cardId }) => {

    const room = rooms[roomId];

    if (!room) return;

    // 🔥 현재 턴 강제 체크
    if (room.turn !== socket.id) {

      console.log(
        "턴 불일치",
        room.turn,
        socket.id
      );

      socket.emit(
        "errorMessage",
        "상대 턴입니다."
      );

      return;
    }

    const isHost =
      socket.id === room.host;

    const hand =
      isHost
        ? room.hostHand
        : room.guestHand;

    const capture =
      isHost
        ? room.hostCapture
        : room.guestCapture;

    // 🔥 카드 찾기
    const cardIndex =
      hand.findIndex(
        c => Number(c.id) === Number(cardId)
      );

    if (cardIndex === -1) {

      console.log(
        "카드 못찾음:",
        cardId
      );

      return;
    }

    const card = hand[cardIndex];

    console.log("낸 카드:", card);


    // =========================
    // 같은 month 카드 찾기
    // =========================
    const matchedCards =
      room.table.filter(
        c =>
          Number(c.month) ===
          Number(card.month)
      );


    // =========================
    // 먹기
    // =========================
    if (matchedCards.length > 0) {

      console.log("먹기 성공");

      // 낸 카드 먹기
      capture.push(card);

      // 바닥 카드 먹기
      matchedCards.forEach(c => {
        capture.push(c);
      });

      // 바닥 제거
      room.table =
        room.table.filter(
          c =>
            Number(c.month) !==
            Number(card.month)
        );

    } else {

      // 바닥에 놓기
      console.log("바닥에 놓음");

      room.table.push(card);
    }


    // =========================
    // 손패 제거
    // =========================
    hand.splice(cardIndex, 1);


    // =========================
    // 턴 변경
    // =========================
    room.turn =
      isHost
        ? room.guest
        : room.host;

    console.log(
      "턴 변경:",
      room.turn
    );


    // =========================
    // 상태 전송
    // =========================
    sendState(roomId);
  });


  // =========================
  // 연결 종료
  // =========================
  socket.on("disconnect", () => {

    console.log("연결 종료:", socket.id);

    for (const roomId in rooms) {

      const room = rooms[roomId];

      if (
        room.host === socket.id ||
        room.guest === socket.id
      ) {

        delete rooms[roomId];

        console.log("방 삭제:", roomId);
      }
    }
  });

});


// =========================
// 서버 실행
// =========================
const PORT =
  process.env.PORT || 3000;

server.listen(PORT, () => {

  console.log(
    `포트 ${PORT} 실행중`
  );
});
