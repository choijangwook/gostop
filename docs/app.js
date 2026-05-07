const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
});

let selected = null;

// =========================
function joinRoom() {
  const roomId = Number(document.getElementById("roomInput").value);

  socket.emit("joinRoom", { roomId });

  // 🔥 로비 제거 (모바일 최적화)
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
// Table
// =========================
function renderTable() {

  const el = document.getElementById("table");
  el.innerHTML = "";

  state.table.forEach(card => {

    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "70px";

    img.onclick = () => {

      if (!selected) return; // 🔥 핵심 차단

      socket.emit("takeCard", {
        roomId: state.roomId,
        tableCard: card
      });
    };

    el.appendChild(img);
  });
}

// =========================
// Hand
// =========================
function renderHand() {

  const el = document.getElementById("hand");
  el.innerHTML = "";

  const hand = state.hands?.[myId] || [];

  hand.forEach(card => {

    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "70px";

    img.onclick = () => {
      selected = card;

      socket.emit("selectHand", {
        roomId: state.roomId,
        card
      });
    };

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
// 먹은 카드
// =========================
function renderCaptured() {

  const el = document.getElementById("captured");
  el.innerHTML = "";

  const list = state.captured?.[myId] || [];

  list.forEach(card => {
    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "40px";
    el.appendChild(img);
  });
}
