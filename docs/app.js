const socket = io("https://gostop-server.onrender.com");

let myId;
let roomId;
let state;

// =========================
// connect
// =========================

socket.on("connect", () => {
  myId = socket.id;
});

// =========================
// join
// =========================

function joinRoom(r) {

  roomId = r || document.getElementById("roomInput").value;

  socket.emit("joinRoom", { roomId });

  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "block";
}

// =========================
// state
// =========================

socket.on("stateUpdate", s => {

  state = s;

  renderHand();
  renderTable();
  renderCaptured();

  const myTurn =
    String(state.turn) === String(myId);

  document.getElementById("turn").innerText =
    myTurn ? "🟢 내 턴" : "⏳ 상대 턴";

  document.getElementById("deck").innerText =
    "남은패 : " + (state.deck?.length || 0);
});

// =========================
// hand
// =========================

function renderHand() {

  const el = document.getElementById("hand");
  el.innerHTML = "";

  const cards = state?.hands?.[myId] || [];

  cards.forEach(card => {

    const img = document.createElement("img");
    img.src = "cards/" + card;

    img.onclick = () => {

      socket.emit("playCard", {
        roomId,
        card
      });
    };

    el.appendChild(img);
  });
}

// =========================
// table
// =========================

function renderTable() {

  const el = document.getElementById("table");
  el.innerHTML = "";

  (state?.table || []).forEach(c => {

    const img = document.createElement("img");
    img.src = "cards/" + c;

    el.appendChild(img);
  });
}

// =========================
// 먹은패 (🔥 핵심 수정)
// =========================

function renderCaptured() {

  const my = document.getElementById("myCaptured");
  const enemy = document.getElementById("enemyCaptured");

  if (my) my.innerHTML = "";
  if (enemy) enemy.innerHTML = "";

  if (!state?.captured) return;

  Object.keys(state.captured).forEach(id => {

    const list = state.captured[id];

    list.forEach(card => {

      const img = document.createElement("img");
      img.src = "cards/" + card;

      if (String(id) === String(myId)) {
        my?.appendChild(img);
      } else {
        enemy?.appendChild(img);
      }
    });
  });
}
