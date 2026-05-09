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

  // 🔥 UI 숨김 (모바일 최적화)
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

      // 🔥 선택 없으면 무시
      if (!selectedHand) return;

      socket.emit("takeCard", {
        roomId: state.roomId,
        tableCard: card
      });
    };

    el.appendChild(img);
  });
}

// =========================
// My Hand
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
      selectedHand = card;

      socket.emit("selectHand", {
        roomId: state.roomId,
        card
      });

      // 🔥 선택 강조 느낌
      img.style.border = "2px solid red";
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
// 🔥 먹은 패 표시 (추가)
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
