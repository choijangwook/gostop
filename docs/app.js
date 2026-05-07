const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;

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
function renderTable() {
  const el = document.getElementById("table");
  el.innerHTML = "";

  if (!state?.table) return;

  state.table.forEach(card => {
    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "60px";
    img.style.margin = "5px";
    el.appendChild(img);
  });
}

// =========================
function renderHand() {
  const el = document.getElementById("hand");
  el.innerHTML = "";

  if (!state?.hands || !state.hands[myId]) return;

  state.hands[myId].forEach(card => {
    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "60px";
    img.style.margin = "5px";
    el.appendChild(img);
  });
}
