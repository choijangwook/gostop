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
// 연결
// =========================

socket.on("connect", () => {

  myId = socket.id;

  console.log("connected:", myId);
});

// =========================
// 방 만들기
// =========================

function createRoom(mode) {

  playerMode = mode;

  const roomId =
    Math.floor(
      100 + Math.random() * 900
    );

  document.getElementById("roomInput")
    .value = roomId;

  joinRoom(true);
}

// =========================
// 방 참가
// =========================

function joinRoom(isHost = false) {

  const roomId =
    Number(
      document.getElementById("roomInput").value
    );

  if (!roomId) {

    alert("방번호 입력");

    return;
  }

  socket.emit("joinRoom", {

    roomId,

    mode: playerMode,

    host: isHost
  });

  document.getElementById("lobby")
    .style.display = "none";

  document.getElementById("game")
    .style.display = "block";

  applyModeUI();
}

// =========================
// 컴퓨터 대결
// =========================

function playWithBot() {

  playerMode = 2;

  const roomId =
    Math.floor(
      100 + Math.random() * 900
    );

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

  applyModeUI();
}

// =========================
// UI 적용
// =========================

function applyModeUI() {

  // 2인용

  if (playerMode === 2) {

    document.body.classList
      .add("twoPlayer");

    document
      .getElementById("enemy1Title")
      .innerText =
        "상대방이 먹은패";
  }

  // 3인용

  else {

    document.body.classList
      .remove("twoPlayer");

    document
      .getElementById("enemy1Title")
      .innerText =
        "1번 상대 먹은패";
  }
}

// =========================
// 상태 업데이트
// =========================

socket.on("stateUpdate", s => {

  state = s;

  // 서버 mode 기준으로 UI 자동 변경

  if (state.players.length >= 3) {

    playerMode = 3;
  }

  else {

    playerMode = 2;
  }

  applyModeUI();

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
// 내패
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
// 먹은패 줄
// =========================

function getCaptureRow(
  playerId,
  card,
  enemies
) {

  const type =
    getCardType(card);

  // 내 먹은패

  if (playerId === myId) {

    return document.getElementById(
      "my" + type
    );
  }

  // 상대1

  if (playerId === enemies[0]) {

    return document.getElementById(
      "enemy1" + type
    );
  }

  // 상대2

  if (playerId === enemies[1]) {

    return document.getElementById(
      "enemy2" + type
    );
  }

  return null;
}
