const socket = io();

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

socket.on("startGame", (state) => {
  console.log(state);
  render(state);
});

function render(state) {
  const game = document.getElementById("game");

  game.innerHTML = `
    <h3>내 카드 (${state.player.length})</h3>
    <pre>${JSON.stringify(state.player, null, 2)}</pre>

    <h3>바닥 (${state.table.length})</h3>
    <pre>${JSON.stringify(state.table, null, 2)}</pre>
  `;
}
