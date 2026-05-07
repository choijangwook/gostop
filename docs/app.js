const socket = io(
  "https://gostop-server.onrender.com",
  {
    transports: ["websocket"]
  }
);

let state = null;

let myId = null;

let playerMode = 2;

// =========================
// 모드 선택
// =========================

function setMode(mode) {

  playerMode = mode;

  alert(mode + "인용 선택");
}

// =========================
// 연결
// =========================

socket.on("connect", () => {

  myId = socket.id;

  console.log("connected:", myId);
});

// =========================
// 참가
// =========================

function joinRoom() {

  const roomId =
    Number(
      document.getElementById("roomInput").value
    );

  if (!roomId) return;

  socket.emit("joinRoom", {

    roomId,

    mode: playerMode
  });

  document.getElementById("lobby")
    .style.display = "none";

  document.getElementById("game")
    .style.display = "block";

  applyModeLayout();
}

// =========================
// 컴퓨터 대결
// =========================

function playWithBot() {

  const roomId =
    Math.floor(100 + Math.random() * 900);

  document.getElementById("roomInput")
    .value = roomId;

  socket.emit("joinRoom", {

    roomId,

    mode: 2,

    bot: true
  });

  document.getElementById("lobby")
    .style.display = "none";

  document.getElementById("game")
    .style.display = "block";

  playerMode = 2;

  applyModeLayout();
}

// =========================
// 2인/3인 레이아웃
// =========================

function applyModeLayout() {

  const enemy2 =
    document.getElementById(
      "enemy2Section"
    );

  const enemy1Title =
    document.getElementById(
      "enemy1Title"
    );

  const game =
    document.getElementById("game");

  // 2인용

  if (playerMode === 2) {

    if (enemy2)
      enemy2.style.display = "none";

    if (enemy1Title)
      enemy1Title.innerText =
        "상대방이 먹은패";

    if (game)
      game.style.height = "100vh";
  }

  // 3인용

  else {

    if (enemy2)
      enemy2.style.display = "block";

    if (enemy1Title)
      enemy1Title.innerText =
        "1번 상대 먹은패";
  }
}

// =========================
// 상태 업데이트
// =========================

socket.on("stateUpdate", s => {

  state = s;

  renderTable();

  renderHand();

  renderCaptured();

  // 턴 표시

  document.getElementById("turn")
    .innerText =
      state.turn === myId
        ? "🟢 내 턴"
        : "⏳ 상대 턴";

  // 남은패

  document.getElementById("deck")
    .innerText =
      "남은패 : " + state.deckCount;

  // 승패

  if (state.winner) {

    document.getElementById("winner")
      .innerText =
        state.winner === myId
          ? "승리!"
          : "패배";
  }
});

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

  myHand.forEach(card => {

    const img =
      document.createElement("img");

    img.src =
      "cards/" + card;

    img.onclick = () => {

      if (state.turn !== myId)
        return;

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

  const enemies =
    Object.keys(state.captured)
      .filter(id => id !== myId);

  Object.keys(state.captured)
    .forEach(playerId => {

      const cards =
        state.captured[playerId];

      cards.forEach(card => {

        const row =
          getCaptureRow(
            playerId,
            card,
            enemies
          );

        if (!row) return;

        const img =
          document.createElement("img");

        img.src =
          "cards/" + card;

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

    "enemy1Bright",
    "enemy1Animal",
    "enemy1Ribbon",
    "enemy1Junk",

    "enemy2Bright",
    "enemy2Animal",
    "enemy2Ribbon",
    "enemy2Junk",

    "myBright",
    "myAnimal",
    "myRibbon",
    "myJunk"

  ].forEach(id => {

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
// 어느 줄인지
// =========================

function getCaptureRow(
  playerId,
  card,
  enemies
) {

  const type =
    getCardType(card);

  // 내 패

  if (playerId === myId) {

    return document.getElementById(
      "my" + type
    );
  }

  // 적1

  if (playerId === enemies[0]) {

    return document.getElementById(
      "enemy1" + type
    );
  }

  // 적2

  if (playerId === enemies[1]) {

    return document.getElementById(
      "enemy2" + type
    );
  }

  return null;
}
