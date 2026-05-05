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

// 🔥 디버그
socket.on("connect", () => {
  console.log("서버 연결됨:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("연결 실패:", err.message);
});

function render() {
  const game = document.getElementById("game");

  game.innerHTML = `
    <h3>내 카드</h3>
    ${state.player1.map(c => `<span>${c.month}</span>`).join(" ")}

    <h3>바닥</h3>
    ${state.table.map(c => `<span>${c.month}</span>`).join(" ")}
  `;
}
