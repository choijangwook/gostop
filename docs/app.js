const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;
let selectedHand = null;

socket.on("connect", () => {
  myId = socket.id;
});

// =========================
function joinRoom() {
  const roomId = Number(document.getElementById("roomInput").value);

  socket.emit("joinRoom", { roomId });

  document.getElementById("lobby").style.display = "none";
}

// =========================
socket.on("stateUpdate", (s) => {
  state = s;

  renderTable();
  renderHand();
  renderCaptured();
});

// =========================
// Table (먹기 대상)
// =========================
function renderTable() {

  const el = document.getElementById("table");
  el.innerHTML = "";

  state.table.forEach(card => {

    const img = document.createElement("img");
    img.src = "cards/" + card;

    img.addEventListener("click", () => {
      if (!selectedHand) return;

      socket.emit("takeCard", {
        roomId: state.roomId,
        tableCard: card
      });

      selectedHand = null;
    });

    el.appendChild(img);
  });
}

// =========================
// My Hand (선택)
// =========================
function renderHand() {

  const el = document.getElementById("hand");
  el.innerHTML = "";

  const hand = state.hands?.[myId] || [];

  hand.forEach(card => {

    const img = document.createElement("img");
    img.src = "cards/" + card;

    img.addEventListener("click", (e) => {
      e.preventDefault();

      selectedHand = card;

      socket.emit("selectHand", {
        roomId: state.roomId,
        card
      });
    });

    // 🔥 모바일 클릭 안정화
    img.style.touchAction = "manipulation";

    el.appendChild(img);
  });

  const btn = document.createElement("button");
  btn.innerText = "특수카드";

  btn.onclick = () => {
    socket.emit("useSpecial", {
      roomId: state.roomId
    });
  };

  el.appendChild(btn);
}

// =========================
// Captured
// =========================
function renderCaptured() {

  const el = document.getElementById("captured");
  el.innerHTML = "";

  const list = state.captured?.[myId] || [];

  list.forEach(card => {
    const img = document.createElement("img");
    img.src = "cards/" + card;
    el.appendChild(img);
  });
}
