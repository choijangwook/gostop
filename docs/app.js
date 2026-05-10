const socket = io();

let myId = null;
let roomId = "room1";
let state = null;

// =========================
// connect
// =========================

socket.on("connect", () => {
  myId = socket.id;

  console.log("socket connected:", myId);

  socket.emit("joinRoom", { roomId });
});

// =========================
// state update
// =========================

socket.on("stateUpdate", data => {

  state = data;

  render();

  // 🔥 핵심 수정: role 기반 턴 계산
  const myRole = data.roles?.[myId];
  const isMyTurn = myRole === data.turn;

  const turnEl = document.getElementById("turn");

  if (turnEl) {
    turnEl.innerText = isMyTurn ? "🟢 내 턴" : "🔴 상대 턴";
  }
});

// =========================
// play card
// =========================

function playCard(card){

  const myRole = state?.roles?.[myId];
  const isMyTurn = myRole === state?.turn;

  if(!isMyTurn) return;

  socket.emit("playCard", {
    roomId,
    card
  });
}

// =========================
// restart
// =========================

function restartGame(){
  socket.emit("restartGame", roomId);
}

// =========================
// leave
// =========================

function leaveRoom(){
  location.reload();
}

// =========================
// render
// =========================

function render(){

  if(!state) return;

  renderHand();
  renderTable();
  renderCaptured();
  renderOpponent();
}

// =========================
// hand
// =========================

function renderHand(){

  const el = document.getElementById("hand");
  if(!el) return;

  el.innerHTML = "";

  const cards = state?.hands?.[myId] || [];

  cards.forEach(card => {

    const img = document.createElement("img");
    img.src = "/cards/" + card;

    img.onclick = () => playCard(card);

    el.appendChild(img);
  });
}

// =========================
// table
// =========================

function renderTable(){

  const el = document.getElementById("table");
  if(!el) return;

  el.innerHTML = "";

  (state?.table || []).forEach(card => {

    const img = document.createElement("img");
    img.src = "/cards/" + card;

    el.appendChild(img);
  });
}

// =========================
// 내 먹은패
// =========================

function renderCaptured(){

  const el = document.getElementById("captured");
  if(!el) return;

  el.innerHTML = "";

  const cards = state?.captured?.[myId] || [];

  cards.forEach(card => {

    const img = document.createElement("img");
    img.src = "/cards/" + card;

    el.appendChild(img);
  });
}

// =========================
// 상대 먹은패
// =========================

function renderOpponent(){

  const el = document.getElementById("opponentCaptured");
  if(!el) return;

  el.innerHTML = "";

  Object.keys(state?.captured || {}).forEach(id => {

    if(id === myId) return;

    (state.captured[id] || []).forEach(card => {

      const img = document.createElement("img");
      img.src = "/cards/" + card;

      el.appendChild(img);
    });
  });
}
