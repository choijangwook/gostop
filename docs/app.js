const socket = io(
  "https://gostop-server.onrender.com",
  {
    transports: ["websocket"]
  }
);

let state = null;
let myId = null;

// =========================
// 사운드
// =========================

const cardSound =
  new Audio("cards/sounds/card.mp3");

const captureSound =
  new Audio("cards/sounds/capture.mp3");

const turnSound =
  new Audio("cards/sounds/turn.mp3");

const winSound =
  new Audio("cards/sounds/win.mp3");

const loseSound =
  new Audio("cards/sounds/lose.mp3");

const buttonSound =
  new Audio("cards/sounds/button.mp3");

const bgm =
  new Audio("cards/sounds/bgm.mp3");

bgm.loop = true;
bgm.volume = 0.3;

// =========================
// 연결
// =========================

socket.on("connect", () => {

  myId = socket.id;

  console.log("내 아이디:", myId);
});

// =========================
// 참가
// =========================

function joinRoom() {

  buttonSound.play();

  bgm.play();

  const roomId =
    Number(
      document.getElementById("roomInput").value
    );

  if (!roomId) return;

  socket.emit("joinRoom", {
    roomId
  });

  document.getElementById("lobby")
    .style.display = "none";

  document.getElementById("game")
    .style.display = "block";
}

// =========================
// 컴퓨터 대결
// =========================

function playWithBot() {

  buttonSound.play();

  bgm.play();

  const roomId =
    Math.floor(100 + Math.random() * 900);

  document.getElementById("roomInput")
    .value = roomId;

  socket.emit("joinRoom", {
    roomId,
    bot: true
  });

  document.getElementById("lobby")
    .style.display = "none";

  document.getElementById("game")
    .style.display = "block";
}

// =========================
// 나가기
// =========================

function leaveGame() {

  location.reload();
}

// =========================
// 상태 업데이트
// =========================

socket.on("stateUpdate", (s) => {

  state = s;

  console.log("현재 state:", state);

  renderEnemyHand();
  renderTable();
  renderHand();
  renderCaptured();

  // 턴 표시
  const isMyTurn =
    state.turn === myId;

  document.getElementById("turn")
    .innerText =
      isMyTurn
        ? "🟢 내 턴"
        : "⏳ 상대 턴";

  // 남은패
  document.getElementById("deck")
    .innerText =
      "남은패 : " +
      (state.deck?.length || 0);

  // 턴 효과음
  if (isMyTurn) {

    turnSound.currentTime = 0;

    turnSound.play();
  }

  // 먹기 효과음
  if (state.lastCapture) {

    captureSound.currentTime = 0;

    captureSound.play();
  }

  // 승패
  if (state.winner) {

    if (state.winner === myId) {

      winSound.play();

      document.getElementById("winner")
        .innerText = "승리!";

    } else if (
      state.winner === "draw"
    ) {

      document.getElementById("winner")
        .innerText = "무승부";

    } else {

      loseSound.play();

      document.getElementById("winner")
        .innerText = "패배";
    }
  }
});

// =========================
// 상대 패
// =========================

function renderEnemyHand() {

  const enemyHand =
    document.getElementById("enemyHand");

  if (!enemyHand) return;

  enemyHand.innerHTML = "";

  const players =
    state.players || [];

  const enemy =
    players.find(
      p => p !== myId
    );

  if (!enemy) return;

  const enemyCards =
    state.hands?.[enemy] || [];

  enemyCards.forEach(() => {

    const img =
      document.createElement("img");

    img.src =
      "cards/0-back.png";

    img.className =
      "backCard";

    enemyHand.appendChild(img);
  });
}

// =========================
// 바닥패
// =========================

function renderTable() {

  const table =
    document.getElementById("table");

  if (!table) return;

  table.innerHTML = "";

  (state.table || []).forEach(card => {

    const img =
      document.createElement("img");

    img.src =
      "cards/" + card;

    table.appendChild(img);
  });
}

// =========================
// 내 패
// =========================

function renderHand() {

  const handDiv =
    document.getElementById("hand");

  if (!handDiv) return;

  handDiv.innerHTML = "";

  const myHand =
    state.hands?.[myId] || [];

  const isMyTurn =
    state.turn === myId;

  myHand.forEach(card => {

    const img =
      document.createElement("img");

    // 이미지 깨짐 방지
    img.src =
      "cards/" +
      encodeURIComponent(card);

    // 상대턴일때만 살짝 어둡게
    if (!isMyTurn) {

      img.style.filter =
        "brightness(65%)";
    }

    img.onclick = () => {

      if (
        state.turn !== myId
      ) {
        return;
      }

      cardSound.currentTime = 0;

      cardSound.play();

      socket.emit("playCard", {
        roomId: state.roomId,
        card
      });
    };

    handDiv.appendChild(img);
  });
}

// =========================
// 먹은패
// =========================

function renderCaptured() {

  clearCaptured();

  if (!state.captured)
    return;

  Object.keys(state.captured)
    .forEach(playerId => {

      const cards =
        state.captured[playerId];

      cards.forEach(card => {

        const row =
          getCaptureRow(
            playerId,
            card
          );

        if (!row)
          return;

        const img =
          document.createElement("img");

        img.src =
          "cards/" +
          encodeURIComponent(card);

        img.className =
          "captureCard";

        row.appendChild(img);
      });
    });
}

// =========================
// 초기화
// =========================

function clearCaptured() {

  [
    "enemyBright",
    "enemyAnimal",
    "enemyRibbon",
    "enemyJunk",

    "myBright",
    "myAnimal",
    "myRibbon",
    "myJunk"
  ]
  .forEach(id => {

    const el =
      document.getElementById(id);

    if (el)
      el.innerHTML = "";
  });
}

// =========================
// 카드 종류
// =========================

function getCardType(card) {

  if (card.includes("bright"))
    return "Bright";

  if (card.includes("animal"))
    return "Animal";

  if (card.includes("ribbon"))
    return "Ribbon";

  return "Junk";
}

// =========================
// 먹은패 위치
// =========================

function getCaptureRow(playerId, card) {

  const mine =
    playerId === myId;

  const type =
    getCardType(card);

  const prefix =
    mine
      ? "my"
      : "enemy";

  return document.getElementById(
    prefix + type
  );
}
