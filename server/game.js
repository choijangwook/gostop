// =============================
// GAME STATE (단일 진실 구조)
// =============================
const state = {
  roomId: null,
  players: {}, // socketId 기반
  turn: null,  // 현재 턴 socketId
  table: [],   // 바닥패
};

// =============================
// SOCKET CONNECT
// =============================
const socket = io();

// =============================
// ROOM JOIN
// =============================
function joinRoom(roomId) {
  state.roomId = roomId;
  socket.emit("joinRoom", { roomId });
}

// =============================
// SERVER SYNC (핵심)
// =============================
socket.on("stateUpdate", (serverState) => {
  state.players = serverState.players;
  state.turn = serverState.turn;
  state.table = serverState.table;

  renderTable();
  renderHand();
});

// =============================
// 내 턴 체크 (핵심 수정 포인트)
// =============================
function isMyTurn() {
  return socket.id === state.turn;
}

// =============================
// 바닥패 먹기 (핵심 로직)
// =============================
function takeCard(cardId) {
  // ❌ 기존 문제: PC/모바일 로직 분리 or device 기준 체크
  // ❌ if (isPC || isMobile) 따로 판단 이런 구조

  // ✅ 수정: 서버 기준 턴만 허용
  if (!isMyTurn()) return;

  socket.emit("takeCard", {
    roomId: state.roomId,
    cardId: cardId,
  });
}

// =============================
// 서버가 실제 처리 (중요)
// =============================
socket.on("cardTaken", (data) => {
  // 서버가 검증 완료 후 상태 브로드캐스트
  state.table = data.table;
  state.players = data.players;
  state.turn = data.turn;

  renderTable();
  renderHand();
});

// =============================
// 턴 넘기기
// =============================
function endTurn() {
  if (!isMyTurn()) return;

  socket.emit("endTurn", {
    roomId: state.roomId,
  });
}

// =============================
// 렌더링 (UI)
// =============================
function renderTable() {
  const el = document.getElementById("table");
  el.innerHTML = "";

  state.table.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = card.id;

    // 클릭으로 먹기
    div.onclick = () => takeCard(card.id);

    el.appendChild(div);
  });
}

function renderHand() {
  const me = state.players[socket.id];
  if (!me) return;

  const el = document.getElementById("hand");
  el.innerHTML = "";

  me.hand.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = card.id;

    el.appendChild(div);
  });
}
