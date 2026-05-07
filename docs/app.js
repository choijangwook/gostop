const socket = io("https://YOUR-SERVER-URL");

let state = null;
let myId = null;

// ======================
// 연결
// ======================
socket.on("connect", () => {
  myId = socket.id;
});

// ======================
// 서버 상태 수신
// ======================
socket.on("stateUpdate", (serverState) => {
  state = serverState;
  render();
});

// ======================
// 방 만들기
// ======================
function createRoom() {
  const roomId = Math.floor(Math.random() * 100000);

  socket.emit("createRoom", { roomId });

  document.getElementById("roomId").innerText = roomId;
}

// ======================
// 방 참가
// ======================
function joinRoom() {
  const roomId = document.getElementById("inputRoom").value;

  socket.emit("joinRoom", { roomId });
}

// ======================
// 턴 체크 (서버 기준)
// ======================
function isMyTurn() {
  if (!state) return false;
  return state.turnOrder[state.turnIndex] === myId;
}

// ======================
// 카드 먹기
// ======================
function takeCard(cardId) {
  if (!isMyTurn()) return;

  socket.emit("takeCard", {
    roomId: state.roomId,
    cardId,
  });
}

// ======================
// 렌더
// ======================
function render() {
  if (!state) return;

  const table = document.getElementById("table");
  table.innerHTML = "";

  state.table.forEach(card => {
    const el = document.createElement("div");
    el.innerText = card.id;

    el.onclick = () => takeCard(card.id);

    table.appendChild(el);
  });
}
