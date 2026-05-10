const socket = io("https://gostop-server.onrender.com");

let myId = null;
let currentRoom = null;
let state = null;

// =========================
// 닉네임
// =========================

let myName =
  localStorage.getItem("name") ||
  prompt("닉네임 입력") ||
  "guest";

localStorage.setItem("name", myName);

// =========================
// 링크 자동 입장
// =========================

const params = new URLSearchParams(location.search);
const autoRoom = params.get("room");

if (autoRoom) {
  setTimeout(() => joinRoom(autoRoom), 300);
}

// =========================
// connect
// =========================

socket.on("connect", () => {
  myId = socket.id;
});

// =========================
// 방 입장
// =========================

function joinRoom(roomId) {

  const room =
    roomId ||
    document.getElementById("roomInput").value;

  if (!room) return;

  currentRoom = room;

  socket.emit("joinRoom", {
    roomId: room,
    name: myName
  });

  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "block";
}

// =========================
// 공유 링크
// =========================

function copyLink() {

  const link =
    location.origin + "?room=" + currentRoom;

  navigator.clipboard.writeText(link);

  alert("링크 복사됨");
}

// =========================
// state
// =========================

socket.on("stateUpdate", s => {
  state = s;

  renderHand();
  renderTable();

  document.getElementById("turn").innerText =
    state.turn === myId ? "🟢 내 턴" : "⏳ 상대 턴";

  document.getElementById("deck").innerText =
    "남은패 : " + (state.deck?.length || 0);
});

// =========================
// hand
// =========================

function renderHand() {
  const el = document.getElementById("hand");
  el.innerHTML = "";

  const cards = state?.hands?.[myId] || [];

  cards.forEach(card => {
    const img = document.createElement("img");
    img.src = "cards/" + card;

    img.onclick = () => {
      socket.emit("playCard", {
        roomId: currentRoom,
        card
      });
    };

    el.appendChild(img);
  });
}

// =========================
// table
// =========================

function renderTable() {
  const el = document.getElementById("table");
  el.innerHTML = "";

  (state?.table || []).forEach(c => {
    const img = document.createElement("img");
    img.src = "cards/" + c;
    el.appendChild(img);
  });
}
