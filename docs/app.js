const socket = io(
  "https://gostop-server.onrender.com",
  {
    transports: ["websocket"]
  }
);

let state = null;

let myId = null;

// =========================
// 연결
// =========================

socket.on("connect", () => {

  myId = socket.id;

  console.log("connected:", myId);
});

// =========================
// 방 참가
// =========================

function joinRoom() {

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
// 상태 업데이트
// =========================

socket.on("stateUpdate", (s) => {

  state = s;

  console.log("state:", state);

  renderTable();

  renderHand();

  renderCaptured();

  // 턴
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
        state.winner === "draw"
          ? "무승부"
          : (
              state.winner === myId
                ? "승리!"
                : "패배"
            );
  }
});

// =========================
// 바닥패
// =========================

function renderTable() {

  const table =
    document.getElementById("table");

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

  handDiv.innerHTML = "";

  const hand =
    state.hands?.[myId] || [];

  hand.forEach(card => {

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
// 먹은패 렌더
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
          "cards/" + card;

        img.className =
          "captureCard";

        row.appendChild(img);
      });
    });
}

// =========================
// 줄 초기화
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
// 렌더 위치
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
