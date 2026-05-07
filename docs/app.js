const socket =
  io("https://gostop-server.onrender.com");

let currentRoom = "";
let myHand = [];
let table = [];
let capture = [];
let currentTurn = "";

socket.on("connect", () => {
  console.log("서버 연결됨");
});

function createRoom() {
  socket.emit("createRoom");
}

function joinRoom() {

  const roomId =
    document.getElementById("roomInput").value;

  socket.emit("joinRoom", roomId);
}

socket.on("roomCreated", (roomId) => {

  currentRoom = roomId;

  document.getElementById("roomInput").value =
    roomId;

  alert("방 코드: " + roomId);
});

socket.on("startGame", () => {
  console.log("게임 시작");
});

socket.on("updateState", (state) => {

  myHand = state.myHand;
  table = state.table;
  capture = state.capture;
  currentTurn = state.turn;

  render();
});

function render() {

  document.getElementById("game").innerHTML = `

    <h2>
      ${
        currentTurn === socket.id
        ? "🟢 내 턴"
        : "⏳ 상대 턴"
      }
    </h2>

    <h3>바닥 패</h3>

    <div class="cards">

      ${
        table.map(card => `

          <img
            src="cards/${card.file}"
          >

        `).join("")
      }

    </div>

    <h3>내 패</h3>

    <div class="cards">

      ${
        myHand.map((card, index) => `

          <img
            src="cards/${card.file}"
            onclick="playCard(${index})"
          >

        `).join("")
      }

    </div>

    <h3>먹은 패</h3>

    <div class="cards">

      ${
        capture.map(card => `

          <img
            src="cards/${card.file}"
          >

        `).join("")
      }

    </div>
  `;
}

function playCard(index) {

  if (currentTurn !== socket.id) {

    alert("상대 턴입니다.");
    return;
  }

  socket.emit("playCard", {
    roomId: currentRoom,
    index
  });
}
