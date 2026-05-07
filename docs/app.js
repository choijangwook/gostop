const socket =
  io("https://gostop-server.onrender.com");

let state = null;

let myId = null;

// =========================
socket.on("connect", () => {

  myId = socket.id;

  console.log("connected:", myId);
});

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
}

// =========================
socket.on("stateUpdate", (s) => {

  state = s;

  // 턴 표시
  const turnText =
    state.turn === myId
      ? "🟢 내 턴"
      : "⏳ 상대 턴";

  document.getElementById("turn")
    .innerText = turnText;

  // 남은 카드
  document.getElementById("deck")
    .innerText = `Deck : ${state.deckCount}`;

  // 게임 종료
  if (state.gameOver) {

    document.getElementById("turn")
      .innerText = "🎉 게임 종료";
  }

  renderTable();
  renderHand();
  renderCaptured();
});

// =========================
// Table
// =========================
function renderTable() {

  const el =
    document.getElementById("table");

  el.innerHTML = "";

  (state.table || []).forEach(card => {

    const img =
      document.createElement("img");

    img.src = "cards/" + card;

    el.appendChild(img);
  });
}

// =========================
// My Hand
// =========================
function renderHand() {

  const el =
    document.getElementById("hand");

  el.innerHTML = "";

  const hand =
    state.hands?.[myId] || [];

  hand.forEach(card => {

    const img =
      document.createElement("img");

    img.src = "cards/" + card;

    img.onclick = () => {

      // 내 턴 아닐 때 차단
      if (state.turn !== myId) return;

      socket.emit("playCard", {
        roomId: state.roomId,
        card
      });
    };

    el.appendChild(img);
  });
}

// =========================
// Captured
// =========================
function renderCaptured() {

  const el =
    document.getElementById("captured");

  el.innerHTML = "";

  const captured =
    state.captured?.[myId] || [];

  captured.forEach(card => {

    const img =
      document.createElement("img");

    img.src = "cards/" + card;

    img.style.width = "35px";

    el.appendChild(img);
  });
}
