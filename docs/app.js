const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;

// =========================
// 연결
// =========================
socket.on("connect", () => {
  myId = socket.id;
  console.log("connected:", myId);
});

// =========================
// 방 참가
// =========================
function joinRoom() {
  const roomId = document.getElementById("roomInput").value;

  if (!roomId) return;

  const numRoom = Number(roomId);

  if (numRoom < 100 || numRoom > 999) {
    alert("3자리 숫자 (100~999)");
    return;
  }

  socket.emit("joinRoom", { roomId: numRoom });

  document.getElementById("roomId").innerText = numRoom;
}

// =========================
// 서버 상태 수신
// =========================
socket.on("stateUpdate", (serverState) => {
  state = serverState;

  console.log("room state:", state);

  renderPlayers();
});

// =========================
// 플레이어 렌더링 (핵심)
// =========================
function renderPlayers() {
  const list = document.getElementById("players");
  list.innerHTML = "";

  if (!state || !state.players) return;

  state.players.forEach(id => {
    const li = document.createElement("li");

    li.innerText = (id === myId)
      ? id + " (me)"
      : id;

    list.appendChild(li);
  });
}
