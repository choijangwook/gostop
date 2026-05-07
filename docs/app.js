const socket = io();

let state = null;
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
});

socket.on("stateUpdate", (serverState) => {
  state = serverState;
  render();
});

// 🔥 핵심: 절대 로컬 판단 금지
function isMyTurn() {
  if (!state) return false;
  return state.turnOrder[state.turnIndex] === myId;
}

function takeCard(cardId) {
  // ❌ 로컬 판단 금지 (이게 기존 문제 원인)
  if (!isMyTurn()) return;

  socket.emit("takeCard", {
    roomId,
    cardId,
  });
}

function render() {
  const table = document.getElementById("table");
  table.innerHTML = "";

  if (!state) return;

  state.table.forEach(card => {
    const el = document.createElement("div");
    el.innerText = card.id;

    el.onclick = () => takeCard(card.id);

    table.appendChild(el);
  });
}
