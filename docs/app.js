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
    document.getElementById("roomInput").value.trim();

  // 방번호 자동 생성
  if (!roomId) {

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

  createLayout();

  renderStatus();

  renderEnemyCaptured();

  renderEnemyHands();

  renderTable();

  renderMyHand();

  renderMyCaptured();
}

/* =========================
   레이아웃 자동 생성
========================= */

function createLayout() {

  const game =
    document.getElementById("game");

  if (
    document.getElementById("mainLayout")
  ) return;

  game.innerHTML = `

    <div id="mainLayout">

      <div
        id="status"
        class="section"
      ></div>

      <div class="section">
        <div class="title">
          상대방이 먹은패
        </div>

        <div
          id="enemyCaptured"
          class="row"
        ></div>
      </div>

      <div class="section">
        <div class="title">
          상대 패
        </div>

        <div
          id="enemyHands"
          class="row"
        ></div>
      </div>

      <div class="section">
        <div class="title">
          바닥패
        </div>

        <div
          id="table"
          class="row"
        ></div>
      </div>

      <div class="section">
        <div class="title">
          내 패
        </div>

        <div
          id="hand"
          class="row"
        ></div>
      </div>

      <div class="section">
        <div class="title">
          내가 먹은패
        </div>

        <div
          id="captured"
          class="row"
        ></div>
      </div>

      <div
        style="
          display:flex;
          gap:6px;
          margin-top:6px;
        "
      >

        <button
          onclick="leaveRoom()"
          style="flex:1;"
        >
          나가기
        </button>

        <button
          onclick="giveUp()"
          style="flex:1;"
        >
          그만두기
        </button>

      </div>

    </div>
  `;
}

/* =========================
   상태
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
   상대 먹은패
========================= */

function renderEnemyCaptured() {

  const div =
    document.getElementById(
      "enemyCaptured"
    );

  if (!div) return;

  div.innerHTML = "";

  const enemies =
    Object.keys(state.captured || {})
      .filter(id => id !== myId);

  enemies.forEach(id => {

    const cards =
      state.captured[id] || [];

    cards.forEach(card => {

      const img =
        document.createElement("img");

      img.src =
        "cards/" + card;

      div.appendChild(img);
    });
  });
}

/* =========================
   상대 패
========================= */

function renderEnemyHands() {

  const div =
    document.getElementById(
      "enemyHands"
    );

  if (!div) return;

  div.innerHTML = "";

  const enemies =
    Object.keys(state.hands || {})
      .filter(id => id !== myId);

  enemies.forEach(id => {

    const enemyHand =
      state.hands[id] || [];

    // 🔥 핵심 수정:
    // 상대 실제 손패 수만 표시

    enemyHand.forEach(() => {

      const img =
        document.createElement("img");

      img.src =
        "cards/0-back.png";

      div.appendChild(img);
    });
  });
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
   내 패
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

      playSound("card.mp3");

      socket.emit("playCard", {

        roomId: state.roomId,

        card
      });
    };

    hand.appendChild(img);
  });
}

/* =========================
   내 먹은패
========================= */

function renderMyCaptured() {

  const cap =
    document.getElementById(
      "captured"
    );

  if (!cap) return;

  cap.innerHTML = "";

  const myCap =
    state.captured?.[myId] || [];

  myCap.forEach(card => {

    const img =
      document.createElement("img");

    img.src =
      "cards/" + card;

    cap.appendChild(img);
  });
}

/* =========================
   나가기
========================= */

function leaveRoom() {

  location.reload();
}

/* =========================
   그만두기
========================= */

function giveUp() {

  alert("게임 포기");

  location.reload();
}

/* =========================
   사운드
========================= */

function playSound(file) {

  const audio =
    new Audio("sounds/" + file);

  audio.volume = 0.7;

  audio.play();
}
