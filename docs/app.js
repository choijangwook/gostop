const socket = io("https://gostop-server.onrender.com");

console.log("app.js 정상 로드됨");

let gameStarted = false;

socket.on("connect", () => {
  console.log("서버 연결됨:", socket.id);
});

function createRoom() {

  console.log("방 만들기 클릭");

  socket.emit("createRoom");
}

function joinRoom() {

  const roomId =
    document.getElementById("roomInput").value;

  console.log("참가 시도:", roomId);

  if (!roomId) {
    alert("방 코드를 입력하세요");
    return;
  }

  socket.emit("joinRoom", roomId);
}

socket.on("roomCreated", (roomId) => {

  console.log("방 생성 완료:", roomId);

  document.getElementById("roomInput").value =
    roomId;

  alert("방 코드: " + roomId);
});

socket.on("errorMessage", (msg) => {
  alert(msg);
});

socket.on("startGame", () => {

  console.log("게임 시작");

  gameStarted = true;

  renderGame();
});

function renderGame() {

  const game =
    document.getElementById("game");

  game.innerHTML = `
    <h2>🎴 게임 시작!</h2>

    <div class="table">
      <p>바닥 패</p>

      <div class="cards">
        <img src="cards/1_bright.png">
        <img src="cards/3_ribbon.png">
        <img src="cards/8_animal.png">
      </div>
    </div>

    <div class="hand">
      <p>내 패</p>

      <div class="cards">

        <img src="cards/1_junk1.png">

        <img src="cards/2_junk1.png">

        <img src="cards/3_junk1.png">

        <img src="cards/4_junk1.png">

        <img src="cards/5_junk1.png">

      </div>
    </div>
  `;
}
