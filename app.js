const socket = io("https://gostop-server.onrender.com");

let currentRoom = null;
let state = null;

function createRoom() {
  socket.emit("createRoom");
}

function joinRoom() {
  const roomId = document.getElementById("roomInput").value;
  currentRoom = roomId;
  socket.emit("joinRoom", roomId);
}

socket.on("roomCreated", (roomId) => {
  alert("방 코드: " + roomId);
  currentRoom = roomId;
});

socket.on("startGame", (gameState) => {
  state = gameState;
  render();
});

socket.on("connect", () => {
  console.log("서버 연결됨:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("연결 실패:", err.message);
});

/* 🔥 카드 클릭 로직 */
function playCard(index) {
  const card = state.player1[index];

  // 같은 월 찾기
  const matchIndex = state.table.findIndex(c => c.month === card.month);

  if (matchIndex !== -1) {
    // 짝 맞추기
    state.table.splice(matchIndex, 1);
    alert("짝 맞췄다! (" + card.month + ")");
  } else {
    // 바닥에 놓기
    state.table.push(card);
  }

  // 내 카드 제거
  state.player1.splice(index, 1);

  render();
}

/* 🔥 화면 렌더링 */
function render() {
  const game = document.getElementById("game");

  game.innerHTML = `
    <h3>내 카드</h3>
    ${state.player1.map((c, i) => `
      <span onclick="playCard(${i})"
        style="
          cursor:pointer;
          margin:5px;
          padding:8px;
          border:1px solid white;
          display:inline-block;
        ">
        ${c.month}
      </span>
    `).join("")}

    <h3>바닥</h3>
    ${state.table.map(c => `
      <span style="margin:5px;">${c.month}</span>
    `).join("")}
  `;
}
