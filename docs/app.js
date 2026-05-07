const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;

// =========================
socket.on("connect", () => {
  myId = socket.id;
});

// =========================
function joinRoom() {
  const roomId = Number(document.getElementById("roomInput").value);

  socket.emit("joinRoom", { roomId });

  document.getElementById("roomId").innerText = roomId;
}

// =========================
socket.on("stateUpdate", (s) => {
  state = s;

  renderPlayers();
  renderTable();
  renderHand();
});

// =========================
function renderPlayers() {
  const el = document.getElementById("players");
  el.innerHTML = "";

  if (!state?.players) return;

  state.players.forEach(p => {
    const li = document.createElement("li");
    li.innerText = (p === myId) ? p + " (me)" : p;
    el.appendChild(li);
  });
}

// =========================
// 🔥 테이블 (클릭해서 먹기)
// =========================
function renderTable() {
  const el = document.getElementById("table");
  el.innerHTML = "";

  if (!state?.table) return;

  state.table.forEach(card => {
    const img = document.createElement("img");

    img.src = "cards/" + card;
    img.style.width = "60px";
    img.style.margin = "5px";

    // 🔥 먹기 이벤트
    img.onclick = () => {
      socket.emit("takeCard", {
        roomId: state.roomId,
        card: card
      });
    };

    el.appendChild(img);
  });
}

// =========================
// 내 손패
// =========================
function renderHand() {
  const el = document.getElementById("hand");
  el.innerHTML = "";

  const hand = state?.hands?.[myId] || [];

  hand.forEach(card => {
    const img = document.createElement("img");

    img.src = "cards/" + card;
    img.style.width = "60px";
    img.style.margin = "5px";

    el.appendChild(img);
  });
}
