const socket = io(
  "https://gostop-server.onrender.com",
  {
    transports: ["websocket"]
  }
);

let state = null;
let myId = null;

/* =========================
   연결
========================= */

socket.on("connect", () => {

  myId = socket.id;

  console.log("connected:", myId);
});

/* =========================
   상태 수신
========================= */

socket.on("stateUpdate", (s) => {

  state = s;

  render();
});

/* =========================
   방 참가
========================= */

function joinRoom() {

  let roomId =
    document.getElementById("roomInput").value;

  // 방번호 자동 생성
  if (!roomId || roomId.trim() === "") {

    roomId =
      Math.floor(
        100 + Math.random() * 900
      ).toString();

    document.getElementById("roomInput")
      .value = roomId;
  }

  socket.emit("joinRoom", {

    roomId: Number(roomId),

    mode:
      window.selectedMode || 2
  });

  document.getElementById("lobby")
    .style.display = "none";

  document.getElementById("game")
    .style.display = "block";
}

/* =========================
   렌더
========================= */

function render() {

  if (!state) return;

  renderStatus();

  renderTable();

  renderMyHand();

  renderEnemyHands();

  renderCaptured();
}

/* =========================
   상태 표시
========================= */

function renderStatus() {

  const status =
    document.getElementById("status");

  if (!status) return;

  status.innerHTML =

    "방번호 : " +

    (state.roomId || "-") +

    " | " +

    (state.turn === myId
      ? "🟢 내 턴"
      : "⏳ 상대 턴");
}

/* =========================
   바닥패
========================= */

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

/* =========================
   내패
========================= */

function renderMyHand() {

  const hand =
    document.getElementById("hand");

  if (!hand) return;

  hand.innerHTML = "";

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

    hand.appendChild(img);
  });
}

/* =========================
   상대 패 (뒷면)
========================= */

function renderEnemyHands() {

  let enemyDiv =
    document.getElementById("enemyHands");

  // 없으면 자동 생성

  if (!enemyDiv) {

    enemyDiv =
      document.createElement("div");

    enemyDiv.id = "enemyHands";

    enemyDiv.className = "section";

    enemyDiv.innerHTML =

      '<div class="title">상대 패</div>' +

      '<div id="enemyCards" class="row"></div>';

    const game =
      document.getElementById("game");

    game.insertBefore(
      enemyDiv,
      game.firstChild.nextSibling
    );
  }

  const row =
    document.getElementById("enemyCards");

  row.innerHTML = "";

  const enemies =
    Object.keys(state.hands || {})
      .filter(id => id !== myId);

  enemies.forEach(id => {

    const enemyHand =
      state.hands[id] || [];

    enemyHand.forEach(() => {

      const img =
        document.createElement("img");

      img.src =
        "cards/0-back.png";

      row.appendChild(img);
    });
  });
}

/* =========================
   먹은패
========================= */

function renderCaptured() {

  // 내 먹은패

  const myCapDiv =
    document.getElementById("captured");

  if (myCapDiv)
    myCapDiv.innerHTML = "";

  // 상대 먹은패

  let enemyCapDiv =
    document.getElementById("enemyCaptured");

  if (!enemyCapDiv) {

    enemyCapDiv =
      document.createElement("div");

    enemyCapDiv.id = "enemyCaptured";

    enemyCapDiv.className = "section";

    enemyCapDiv.innerHTML =

      '<div class="title">상대방이 먹은패</div>' +

      '<div id="enemyCapturedRow" class="row"></div>';

    const game =
      document.getElementById("game");

    game.appendChild(enemyCapDiv);
  }

  const enemyRow =
    document.getElementById("enemyCapturedRow");

  enemyRow.innerHTML = "";

  // 내 먹은패 표시

  const myCaptured =
    state.captured?.[myId] || [];

  myCaptured.forEach(card => {

    const img =
      document.createElement("img");

    img.src =
      "cards/" + card;

    myCapDiv.appendChild(img);
  });

  // 상대 먹은패 표시

  const enemies =
    Object.keys(state.captured || {})
      .filter(id => id !== myId);

  enemies.forEach(id => {

    const enemyCaptured =
      state.captured[id] || [];

    enemyCaptured.forEach(card => {

      const img =
        document.createElement("img");

      img.src =
        "cards/" + card;

      enemyRow.appendChild(img);
    });
  });
}
