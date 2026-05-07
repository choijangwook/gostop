// docs/app.js

const socket =
  io("https://gostop-server.onrender.com");

console.log("app.js 정상 로드됨");

let currentRoom = "";

let myHand = [];

let table = [];

let capture = [];

let opponentCapture = [];

let currentTurn = "";


// =========================
// 연결
// =========================
socket.on("connect", () => {

  console.log(
    "서버 연결됨:",
    socket.id
  );
});


// =========================
// 방 만들기
// =========================
function createRoom() {

  console.log("방 만들기 클릭");

  socket.emit("createRoom");
}


// =========================
// 방 참가
// =========================
function joinRoom() {

  const roomId =
    document
      .getElementById("roomInput")
      .value
      .trim();

  console.log("참가 시도:", roomId);

  if (!roomId) {

    alert("방 코드를 입력하세요");

    return;
  }

  socket.emit("joinRoom", roomId);
}


// =========================
// 방 생성 완료
// =========================
socket.on("roomCreated", (roomId) => {

  console.log(
    "방 생성 완료:",
    roomId
  );

  currentRoom = roomId;

  document.getElementById(
    "roomInput"
  ).value = roomId;

  alert("방 코드: " + roomId);
});


// =========================
// 게임 시작
// =========================
socket.on("startGame", () => {

  console.log("게임 시작");
});


// =========================
// 에러
// =========================
socket.on("errorMessage", (msg) => {

  console.log("에러:", msg);

  alert(msg);
});


// =========================
// 상태 업데이트
// =========================
socket.on("updateState", (state) => {

  console.log(
    "updateState 수신:",
    state
  );

  myHand = state.myHand || [];

  table = state.table || [];

  capture = state.capture || [];

  opponentCapture =
    state.opponentCapture || [];

  currentTurn = state.turn;

  render();
});


// =========================
// 렌더링
// =========================
function render() {

  const game =
    document.getElementById("game");

  game.innerHTML = `

    <h2>
      ${
        currentTurn === socket.id
          ? "🟢 내 턴"
          : "⏳ 상대 턴"
      }
    </h2>


    <h3>상대 먹은 패</h3>

    <div class="cards">

      ${
        opponentCapture.map(card => `

          <img
            src="cards/${card.file}"
            class="card"
          >

        `).join("")
      }

    </div>


    <h3>바닥 패</h3>

    <div class="cards">

      ${
        table.map(card => `

          <img
            src="cards/${card.file}"
            class="card"
          >

        `).join("")
      }

    </div>


    <h3>내 패</h3>

    <div class="cards">

      ${
        myHand.map(card => `

          <img
            src="cards/${card.file}"
            class="card hand-card"
            data-id="${card.id}"
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
            class="card"
          >

        `).join("")
      }

    </div>
  `;


  // =========================
  // 카드 클릭 이벤트 재연결
  // 모바일 안정화 핵심
  // =========================
  document
    .querySelectorAll(".hand-card")
    .forEach(cardEl => {

      cardEl.onclick = () => {

        const cardId =
          Number(
            cardEl.dataset.id
          );

        playCard(cardId);
      };
    });
}


// =========================
// 카드 플레이
// =========================
function playCard(cardId) {

  console.log(
    "카드 클릭:",
    cardId
  );

  // 🔥 모바일 안정화
  if (
    String(currentTurn) !==
    String(socket.id)
  ) {

    alert("상대 턴입니다.");

    return;
  }

  socket.emit("playCard", {

    roomId: currentRoom,

    cardId: Number(cardId)
  });
}
