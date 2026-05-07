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

  document.getElementById("game")
    .style.display = "block";
}

// =========================
function playWithBot() {

  const randomRoom =
    Math.floor(100 + Math.random() * 900);

  document.getElementById("roomInput")
    .value = randomRoom;

  joinRoom();
}

// =========================
socket.on("stateUpdate", (s) => {

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

  // 남은 패
  document.getElementById("deck")
    .innerText =
      "남은패 : " + state.deckCount;
});

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
function renderCaptured() {

  const el =
    document.getElementById("captured");

  el.innerHTML = "";

  Object.keys(state.captured || {})
    .forEach(playerId => {

      const box =
        document.createElement("div");

      box.className =
        "playerCaptured";

      const title =
        document.createElement("h5");

      title.innerText =
        playerId === myId
          ? "내 먹은패"
          : "상대 먹은패";

      box.appendChild(title);

      const row =
        document.createElement("div");

      row.className =
        "capturedRow";

      state.captured[playerId]
        .forEach(card => {

          const img =
            document.createElement("img");

          img.src = "cards/" + card;

          row.appendChild(img);
        });

      box.appendChild(row);

      el.appendChild(box);
    });
}
