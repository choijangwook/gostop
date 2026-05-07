# 다음 단계: 진짜 고스톱 흐름 추가

추가된 기능:

* 패를 내면 자동으로 덱에서 1장 드로우
* 드로우 카드도 자동 먹기 판정
* 턴 유지
* 남은 덱 표시
* 현재 턴 표시
* 게임 종료 판정

---

# 📁 server/server.js

```javascript
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
// 카드 덱
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

    "special1_draw.png",
    "special2_draw.png",
    "special3_draw.png"
  ];

  return deck.sort(() => Math.random() - 0.5);
}

// =========================
const rooms = {};

// =========================
function nextTurn(room) {

  if (room.players.length === 0) return;

  room.turnIndex++;

  if (room.turnIndex >= room.players.length) {
    room.turnIndex = 0;
  }

  room.turn = room.players[room.turnIndex];
}

// =========================
function captureCard(room, playerId, card) {

  const month = card.split("_")[0];

  const matchIndex = room.table.findIndex(
    c => c.startsWith(month + "_")
  );

  // 먹기 성공
  if (matchIndex !== -1) {

    const matched = room.table.splice(matchIndex, 1)[0];

    room.captured[playerId].push(card);
    room.captured[playerId].push(matched);

  } else {

    room.table.push(card);
  }
}

// =========================
function emitState(roomId) {

  const room = rooms[roomId];
  if (!room) return;

  io.to(roomId).emit("stateUpdate", {
    roomId,
    table: room.table,
    hands: room.hands,
    captured: room.captured,
    turn: room.turn,
    deckCount: room.deck.length,
    gameOver: room.deck.length === 0
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
        captured: {},
        turn: null,
        turnIndex: 0
      };
    }

    const room = rooms[roomId];

    socket.join(roomId);

    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    if (!room.turn) {
      room.turn = socket.id;
    }

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

    // 턴 아닐 경우 차단
    if (room.turn !== socket.id) return;

    const hand = room.hands[socket.id];
    if (!hand) return;

    const handIndex = hand.indexOf(card);

    if (handIndex === -1) return;

    // 손패 제거
    hand.splice(handIndex, 1);

    // =========================
    // 특수 카드
    // =========================
    if (card.startsWith("special")) {

      room.captured[socket.id].push(card);

      const extra = room.deck.shift();

      if (extra) {
        hand.push(extra);
      }

      nextTurn(room);

      emitState(roomId);

      return;
    }

    // =========================
    // 1차 먹기
    // =========================
    captureCard(room, socket.id, card);

    // =========================
    // 드로우
    // =========================
    const drawCard = room.deck.shift();

    if (drawCard) {

      // 드로우 카드 먹기 처리
      captureCard(room, socket.id, drawCard);
    }

    // =========================
    // 턴 변경
    // =========================
    nextTurn(room);

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

      if (room.turn === socket.id) {

        room.turnIndex = 0;

        room.turn = room.players[0] || null;
      }

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
```

---

# 📁 docs/app.js

```javascript
const socket =
  io("https://gostop-server.onrender.com");

let state = null;

let myId = null;

// =========================
socket.on("connect", () => {

  myId = socket.id;

  console.log("connected:", myId);
});

// =========================
function joinRoom() {

  const roomId =
    Number(
      document.getElementById("roomInput").value
    );

  if (!roomId) return;

  socket.emit("joinRoom", {
    roomId
  });

  document.getElementById("lobby")
    .style.display = "none";
}

// =========================
socket.on("stateUpdate", (s) => {

  state = s;

  // 턴 표시
  const turnText =
    state.turn === myId
      ? "🟢 내 턴"
      : "⏳ 상대 턴";

  document.getElementById("turn")
    .innerText = turnText;

  // 남은 카드
  document.getElementById("deck")
    .innerText = `Deck : ${state.deckCount}`;

  // 게임 종료
  if (state.gameOver) {

    document.getElementById("turn")
      .innerText = "🎉 게임 종료";
  }

  renderTable();
  renderHand();
  renderCaptured();
});

// =========================
// Table
// =========================
function renderTable() {

  const el =
    document.getElementById("table");

  el.innerHTML = "";

  (state.table || []).forEach(card => {

    const img =
      document.createElement("img");

    img.src = "cards/" + card;

    el.appendChild(img);
  });
}

// =========================
// My Hand
// =========================
function renderHand() {

  const el =
    document.getElementById("hand");

  el.innerHTML = "";

  const hand =
    state.hands?.[myId] || [];

  hand.forEach(card => {

    const img =
      document.createElement("img");

    img.src = "cards/" + card;

    img.onclick = () => {

      // 내 턴 아닐 때 차단
      if (state.turn !== myId) return;

      socket.emit("playCard", {
        roomId: state.roomId,
        card
      });
    };

    el.appendChild(img);
  });
}

// =========================
// Captured
// =========================
function renderCaptured() {

  const el =
    document.getElementById("captured");

  el.innerHTML = "";

  const captured =
    state.captured?.[myId] || [];

  captured.forEach(card => {

    const img =
      document.createElement("img");

    img.src = "cards/" + card;

    img.style.width = "35px";

    el.appendChild(img);
  });
}
```

---

# 📁 docs/index.html

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, user-scalable=no"
/>

<title>GoStop</title>

<style>

body {
  margin: 0;
  overflow: hidden;
  background: #2f4f2f;
  color: white;
  font-family: sans-serif;
}

#wrap {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding-top: 40px;

  height: 100vh;
  box-sizing: border-box;
}

#lobby {
  margin-bottom: 15px;
}

#game {
  width: 100%;
  max-width: 500px;

  display: flex;
  flex-direction: column;

  align-items: center;

  gap: 12px;
}

#turn,
#deck {
  margin: 0;
}

#table,
#hand,
#captured {
  display: flex;

  flex-wrap: wrap;

  justify-content: center;

  gap: 6px;

  min-height: 70px;
}

img {
  width: 60px;

  user-select: none;
  -webkit-user-drag: none;

  touch-action: manipulation;
}

#hand img {
  width: 65px;
}

#captured img {
  width: 35px;
}

button {
  padding: 10px 15px;
  font-size: 16px;
}

input {
  padding: 10px;
  width: 120px;
  text-align: center;
  font-size: 16px;
}

h3, h4 {
  margin: 4px;
}

</style>
</head>

<body>

<div id="wrap">

  <div id="lobby">

    <input
      id="roomInput"
      maxlength="3"
      placeholder="123"
    >

    <button onclick="joinRoom()">
      참가
    </button>

  </div>

  <div id="game">

    <h3 id="turn">
      대기중...
    </h3>

    <h4 id="deck">
      Deck : 0
    </h4>

    <h4>Table</h4>
    <div id="table"></div>

    <h4>My Hand</h4>
    <div id="hand"></div>

    <h4>Captured</h4>
    <div id="captured"></div>

  </div>

</div>

<script src="https://gostop-server.onrender.com/socket.io/socket.io.js"></script>

<script src="app.js"></script>

</body>
</html>
```
