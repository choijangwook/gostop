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
    document
      .getElementById("roomInput")
      .value
      .trim();

  if (!roomId) return;

  socket.emit("joinRoom", {
    roomId
  });

  document
    .getElementById("lobby")
    .style.display = "none";

  document
    .getElementById("game")
    .style.display = "flex";
}

// =========================
// 컴퓨터 대결
// =========================

function playWithBot() {

  buttonSound.play();

  bgm.play();

  const roomId =
    Math.floor(
      100 + Math.random() * 900
    ).toString();

  socket.emit("joinRoom", {
    roomId,
    bot: true
  });

  document
    .getElementById("lobby")
    .style.display = "none";

  document
    .getElementById("game")
    .style.display = "flex";
}

// =========================
// 나가기
// =========================

function leaveGame() {

  location.reload();
}

// =========================
// 상태 수신
// =========================

socket.on("stateUpdate", (s) => {

  state = s;

  renderEnemyHand();
  renderTable();
  renderHand();
  renderCaptured();

  const isMyTurn =
    String(state.turn)
    ===
    String(myId);

  // 턴 표시
  document
    .getElementById("turn")
    .innerText =
      isMyTurn
        ? "🟢 내 턴"
        : "⏳ 상대 턴";

  // 남은패
  document
    .getElementById("deck")
    .innerText =
      "남은패 : " +
      (
        state.deck
          ? state.deck.length
          : 0
      );

  // 효과음
  if (isMyTurn) {

    turnSound.currentTime = 0;

    turnSound.play();
  }

  if (state.lastCapture) {

    captureSound.currentTime = 0;

    captureSound.play();
  }

  // 승패
  if (state.winner) {

    if (
      String(state.winner)
      ===
      String(myId)
    ) {

      winSound.play();

      document
        .getElementById("winner")
        .innerText = "승리!";

    } else if (
      state.winner === "draw"
    ) {

      document
        .getElementById("winner")
        .innerText = "무승부";

    } else {

      loseSound.play();

      document
        .getElementById("winner")
        .innerText = "패배";
    }
  }
});

// =========================
// 상대 패
// =========================

function renderEnemyHand() {

  const enemyHand =
    document.getElementById(
      "enemyHand"
    );

  if (!enemyHand || !state)
    return;

  enemyHand.innerHTML = "";

  const enemy =
    (state.players || [])
      .find(
        p =>
          String(p)
          !==
          String(myId)
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
    document.getElementById(
      "table"
    );

  if (!table || !state)
    return;

  table.innerHTML = "";

  (state.table || [])
    .forEach(card => {

      const img =
        document.createElement("img");

      // 핵심 수정
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
    document.getElementById(
      "hand"
    );

  if (!handDiv || !state)
    return;

  handDiv.innerHTML = "";

  const myHand =
    state.hands?.[myId] || [];

  const isMyTurn =
    String(state.turn)
    ===
    String(myId);

  myHand.forEach(card => {

    const img =
      document.createElement("img");

    // 핵심 수정
    img.src =
      "cards/" + card;

    // 이미지 깨짐 방지
    img.onerror = () => {

      console.log(
        "이미지 없음:",
        card
      );

      img.src =
        "cards/0-back.png";
    };

    // 상대 턴이면 어둡게
    if (!isMyTurn) {

      img.style.filter =
        "brightness(75%)";
    }

    img.onclick = () => {

      if (
        String(state.turn)
        !==
        String(myId)
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

  if (!state?.captured)
    return;

  Object.keys(state.captured)
    .forEach(playerId => {

      const cards =
        state.captured[playerId];


cards.sort((a, b) => {

  function typeOrder(card){

    if(card.includes("bright")) return 0;

    if(card.includes("animal")) return 1;

    if(card.includes("ribbon")) return 2;

    return 3;
  }

  const ta = typeOrder(a);
  const tb = typeOrder(b);

  if(ta !== tb){

    return ta - tb;
  }

  const ma =
    parseInt(a.split("_")[0]) || 99;

  const mb =
    parseInt(b.split("_")[0]) || 99;

  return ma - mb;
});
      

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

        // 핵심 수정
        img.src =
          "cards/" + card;

        img.onerror = () => {

          img.src =
            "cards/0-back.png";
        };

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
    "enemyBrightAnimal",
    "enemyRibbon",
    "enemyJunk",

    "myBrightAnimal",
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

  if (
    card.includes("bright")
    ||
    card.includes("animal")
  ) {
    return "BrightAnimal";
  }

  if (
    card.includes("ribbon")
  ) {
    return "Ribbon";
  }

  return "Junk";
}

// =========================
// 먹은패 위치
// =========================

function getCaptureRow(
  playerId,
  card
) {

  const mine =
    String(playerId)
    ===
    String(myId);

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
