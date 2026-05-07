const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
});

function joinRoom() {
  const roomId = Number(document.getElementById("roomInput").value);
  socket.emit("joinRoom", { roomId });
  document.getElementById("roomId").innerText = roomId;
}

// =========================
socket.on("stateUpdate", (s) => {
  state = s;
  renderPlayers();
  renderTable();
  renderHand();
});

// =========================
function renderPlayers() {
  const el = document.getElementById("players");
  el.innerHTML = "";

  state.players.forEach(p => {
    const li = document.createElement("li");
    const score = state.score?.[p] || 0;
    li.innerText = (p === myId ? p + " (me)" : p) + " | score: " + score;
    el.appendChild(li);
  });
}

// =========================
// Table (먹기 대상)
// =========================
function renderTable() {
  const el = document.getElementById("table");
  el.innerHTML = "";

  state.table.forEach(card => {
    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "60px";
    img.style.margin = "5px";

    img.onclick = () => {
      socket.emit("takeCard", {
        roomId: state.roomId,
        tableCard: card
      });
    };

    el.appendChild(img);
  });
}

// =========================
// My Hand (선택)
// =========================
function renderHand() {
  const el = document.getElementById("hand");
  el.innerHTML = "";

  const hand = state.hands?.[myId] || [];

  hand.forEach(card => {
    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "60px";
    img.style.margin = "5px";

    img.onclick = () => {
      socket.emit("selectHand", {
        roomId: state.roomId,
        card
      });
    };

    el.appendChild(img);
  });

  const btn = document.createElement("button");
  btn.innerText = "특수카드 사용";

  btn.onclick = () => {
    socket.emit("useSpecial", {
      roomId: state.roomId
    });
  };

  el.appendChild(btn);
}
