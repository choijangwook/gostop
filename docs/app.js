const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;

// =====================
socket.on("connect", () => {
  myId = socket.id;
});

// =====================
function joinRoom() {
  const roomId = Number(document.getElementById("roomInput").value);

  socket.emit("joinRoom", { roomId });

  document.getElementById("roomId").innerText = roomId;
}

// =====================
socket.on("stateUpdate", (s) => {
  state = s;

  renderPlayers();
  renderTable();
});

// =====================
// 플레이어
// =====================
function renderPlayers() {
  const el = document.getElementById("players");
  el.innerHTML = "";

  state.players.forEach(p => {
    const li = document.createElement("li");
    li.innerText = p === myId ? p + " (me)" : p;
    el.appendChild(li);
  });
}

// =====================
// 🔥 화투 카드 표시 (핵심)
// =====================
function renderTable() {
  const table = document.getElementById("table");
  table.innerHTML = "";

  // 테스트용 카드 (서버 없어도 보이게)
  const cards = [
    "11_bright.png",
    "11_junk1.png",
    "12_animal.png",
    "12_ribbon.png"
  ];

  cards.forEach(img => {
    const c = document.createElement("img");

    c.src = "cards/" + img;
    c.style.width = "60px";
    c.style.margin = "5px";

    table.appendChild(c);
  });
}
