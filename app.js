const socket = io("https://gostop-server.onrender.com");

let state = null;

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
  render();
});

/* 🔥 카드 플레이 */
function playCard(index) {
  const card = state.player1[index];

  // 같은 월 카드 찾기
  const matches = state.table.filter(c => c.month === card.month);

  if (matches.length > 0) {
    // 전부 가져오기
    state.table = state.table.filter(c => c.month !== card.month);
    alert(`${card.month}월 카드 먹음 (${matches.length + 1}장)`);
  } else {
    state.table.push(card);
  }

  state.player1.splice(index, 1);

  render();
}

/* 🔥 렌더링 */
function render() {
  const game = document.getElementById("game");

  game.innerHTML = `
    <h3>내 카드</h3>
    ${state.player1.map((c, i) => `
      <img src="cards/${c.file}" onclick="playCard(${i})">
    `).join("")}

    <h3>바닥</h3>
    ${state.table.map(c => `
      <img src="cards/${c.file}">
    `).join("")}
  `;
}
