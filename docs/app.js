const socket = io("https://gostop-server.onrender.com");

let state = null;
let myTurn = false;

console.log("app.js 정상 로드됨");

function createRoom() {
  console.log("방 만들기 클릭");
  socket.emit("createRoom");
}

function joinRoom() {
  const roomId = document.getElementById("roomInput").value;
  console.log("참가 시도:", roomId);
  socket.emit("joinRoom", roomId);
}

socket.on("connect", () => {
  console.log("서버 연결됨:", socket.id);
});

socket.on("roomCreated", (roomId) => {
  alert("방 코드: " + roomId);
});

socket.on("startGame", (gameState) => {
  console.log("게임 시작");
  state = gameState;
  myTurn = gameState.turn === socket.id;
  render();
});

socket.on("updateGame", (gameState) => {
  state = gameState;
  myTurn = gameState.turn === socket.id;
  render();
});

function playCard(index) {
  if (!myTurn) return;
  socket.emit("playCard", index);
}

function render() {
  if (!state) return;

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
