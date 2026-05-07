const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;

// =========================
// 연결
// =========================
socket.on("connect", () => {
  myId = socket.id;
});

// =========================
// 방 참가
// =========================
function joinRoom() {
  const roomId = Number(document.getElementById("roomInput").value);

  socket.emit("joinRoom", { roomId });

  document.getElementById("roomId").innerText = roomId;
}

// =========================
// 서버 상태 수신
// =========================
socket.on("stateUpdate", (s) => {
  state = s;

  renderPlayers();
  renderTable();
  renderHand();
});

// =========================
// 플레이어 표시
// =========================
function renderPlayers() {
  const el = document.getElementById("players");
  el.innerHTML = "";

  state.players.forEach(p => {
    const li = document.createElement("li");
    li.innerText = (p === myId) ? p + " (me)" : p;
    el.appendChild(li);
  });
}

// =========================
// 테이블 카드
// =========================
function renderTable() {
  const el = document.getElementById("table");
  el.innerHTML = "";

  state.table.forEach(card => {
    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "60px";
    img.style.margin = "5px";
    el.appendChild(img);
  });
}

// =========================
// 내 패
// =========================
function renderHand() {
  const el = document.getElementById("hand");
  el.innerHTML = "";

  const hand = state.hands?.[myId] || [];

  hand.forEach(card => {
    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "60px";
    img.style.margin = "5px";
    el.appendChild(img);
  });
}
