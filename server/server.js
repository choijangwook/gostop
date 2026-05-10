const socket = io("https://YOUR_SERVER_URL"); // 필요시 변경

let roomId = null;

let myId = null;
let roles = {};
let myRole = null;

let turn = null;
let isMyTurn = false;

// =========================
// join room
// =========================

function joinRoom(id) {

  roomId = id;

  socket.emit("joinRoom", {
    roomId
  });
}

// =========================
// state update (핵심)
// =========================

socket.on("stateUpdate", (data) => {

  roomId = data.roomId;

  roles = data.roles || {};
  turn = data.turn;

  myId = socket.id;
  myRole = roles[myId];

  // 🔥 핵심 수정 포인트
  isMyTurn = (myRole === turn);

  render(data);
});

// =========================
// 카드 클릭
// =========================

function playCard(card) {

  if (!isMyTurn) return;

  socket.emit("playCard", {
    roomId,
    card
  });
}

// =========================
// 다시하기
// =========================

function restartGame() {

  socket.emit("restart", {
    roomId
  });
}

// =========================
// 나가기
// =========================

function leaveRoom() {

  socket.emit("leaveRoom", {
    roomId
  });

  roomId = null;
  roles = {};
  turn = null;
  isMyTurn = false;
}

// =========================
// render (UI)
// =========================

function render(data) {

  document.getElementById("turnInfo").innerText =
    `TURN: ${data.turn} | MY: ${myRole} | ${isMyTurn ? "내 턴" : "상대 턴"}`;

  renderHand(data.hands?.[myId] || []);
  renderTable(data.table || []);
  renderCaptured(data.captured?.[myId] || []);
}

// =========================
// UI render helpers
// =========================

function renderHand(cards) {
  const el = document.getElementById("hand");
  el.innerHTML = "";

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = card;

    div.onclick = () => playCard(card);

    el.appendChild(div);
  });
}

function renderTable(cards) {
  const el = document.getElementById("table");
  el.innerHTML = "";

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = card;
    el.appendChild(div);
  });
}

function renderCaptured(cards) {
  const el = document.getElementById("captured");
  el.innerHTML = "";

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = card;
    el.appendChild(div);
  });
}
