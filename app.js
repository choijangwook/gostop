const socket = io("https://gostop-server.onrender.com");

let state = null;
let myTurn = false;

function createRoom() {
  socket.emit("createRoom");
}

function joinRoom() {
  const roomId = document.getElementById("roomInput").value;
  socket.emit("joinRoom", roomId);
}

socket.on("roomCreated", (roomId) => {
  alert("방 코드: " + roomId);
});

socket.on("startGame", (gameState) => {
  state = gameState;
  myTurn = gameState.turn === socket.id;
  render();
});

socket.on("updateGame", (gameState) => {
  state = gameState;
  myTurn = gameState.turn === socket.id;
  render();
});

/* 카드 클릭 */
function playCard(index) {
  if (!myTurn) return;

  socket.emit("playCard", index);
}

/* 렌더 */
function render() {
  const game = document.getElementById("game");
  const status = document.getElementById("status");

  status.innerHTML = myTurn ? "🟢 내 턴" : "⏳ 상대 턴";

  game.innerHTML = `
    <h3>내 카드</h3>
    <div class="cards">
      ${state.player.map((c, i) => `
        <img src="cards/${c.file}" onclick="playCard(${i})">
      `).join("")}
    </div>

    <h3>상대 카드 (${state.opponentCount})</h3>
    <div class="cards">
      ${Array(state.opponentCount).fill("🂠").join("")}
    </div>

    <h3>바닥</h3>
    <div class="cards">
      ${state.table.map(c => `
        <img src="cards/${c.file}">
      `).join("")}
    </div>
  `;
}
