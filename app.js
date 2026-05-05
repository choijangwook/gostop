const socket = io("https://gostop-server.onrender.com");

let currentRoom = null;
let currentState = null;

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

socket.on("startGame", (state) => {
  currentState = state;
  render();
});

socket.on("updateGame", (state) => {
  currentState = state;
  render();
});

function playCard(index) {
  socket.emit("playCard", {
    roomId: currentRoom,
    cardIndex: index
  });
}

function render() {
  const game = document.getElementById("game");

  const myCards = currentState.player1;

  game.innerHTML = `
    <h3>내 턴: ${currentState.turn}</h3>

    <h3>내 카드</h3>
    ${myCards.map((c, i) =>
      `<button onclick="playCard(${i})">${c.month}</button>`
    ).join("")}

    <h3>바닥</h3>
    ${currentState.table.map(c => c.month).join(", ")}

    <h3>획득 카드</h3>
    ${currentState.captured1.length}
  `;
}
