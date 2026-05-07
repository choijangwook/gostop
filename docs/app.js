const socket = io(
  "https://gostop-server.onrender.com"
);

console.log("app.js 정상 로드됨");

let currentRoom = "";
let currentTurn = "";

socket.on("connect", () => {
  console.log("서버 연결됨:", socket.id);
});

function createRoom() {

  socket.emit("createRoom");
}

function joinRoom() {

  const roomId =
    document.getElementById("roomInput").value;

  if (!roomId) {
    alert("방 코드를 입력하세요");
    return;
  }

  socket.emit("joinRoom", roomId);
}

socket.on("roomCreated", (roomId) => {

  currentRoom = roomId;

  document.getElementById("roomInput").value =
    roomId;

  alert("방 코드: " + roomId);
});

socket.on("errorMessage", (msg) => {
  alert(msg);
});

socket.on("startGame", (data) => {

  currentTurn = data.turn;

  renderGame();
});

socket.on("turnChanged", (data) => {

  currentTurn = data.turn;

  renderTurn();
});

function renderGame() {

  const game =
    document.getElementById("game");

  game.innerHTML = `
    <h2 id="turnText"></h2>

    <div class="cards">

      <img src="cards/1_junk1.png"
        onclick="playCard()">

      <img src="cards/2_junk1.png"
        onclick="playCard()">

      <img src="cards/3_junk1.png"
        onclick="playCard()">

    </div>
  `;

  renderTurn();
}

function renderTurn() {

  const text =
    document.getElementById("turnText");

  if (!text) return;

  if (currentTurn === socket.id) {

    text.innerHTML =
      "🟢 내 턴";

  } else {

    text.innerHTML =
      "⏳ 상대 턴";
  }
}

function playCard() {

  if (currentTurn !== socket.id) {

    alert("상대 턴입니다.");
    return;
  }

  socket.emit("playCard", {
    roomId: currentRoom
  });
}
