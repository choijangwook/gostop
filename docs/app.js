const socket = io("https://gostop-server.onrender.com");

let myId = localStorage.getItem("myId");
let currentRoom = null;
let state = null;

// =========================
// 자동 입장
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
  localStorage.setItem("myId", myId);
});

// =========================
// join
// =========================

function joinRoom(roomId) {

  const room =
    roomId ||
    document.getElementById("roomInput").value;

  if (!room) return;

  currentRoom = room;

  socket.emit("joinRoom", room);

  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "block";
}

// =========================
// state
// =========================

socket.on("stateUpdate", s => {
  state = s;

  renderHand();
  renderTable();
  renderCaptured();

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

// =========================
// captured (정렬 포함)
// =========================

function renderCaptured() {
  const el = document.getElementById("myCaptured");
  if (!el) return;

  el.innerHTML = "";

  const cards = state?.captured?.[myId] || [];

  cards.sort();

  cards.forEach(c => {
    const img = document.createElement("img");
    img.src = "cards/" + c;
    el.appendChild(img);
  });
}
