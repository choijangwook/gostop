const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
});

// =========================
function joinRoom() {

  const roomId = Number(
    document.getElementById("roomInput").value
  );

  socket.emit("joinRoom", { roomId });

  document.getElementById("lobby").style.display = "none";
}

// =========================
socket.on("stateUpdate", (s) => {

  state = s;

  renderTable();
  renderHand();
  renderCaptured();
});

// =========================
// Table
// =========================
function renderTable() {

  const el = document.getElementById("table");
  el.innerHTML = "";

  (state.table || []).forEach(card => {

    const img = document.createElement("img");
    img.src = "cards/" + card;

    el.appendChild(img);
  });
}

// =========================
// My Hand
// =========================
function renderHand() {

  const el = document.getElementById("hand");
  el.innerHTML = "";

  const hand = state.hands?.[myId] || [];

  hand.forEach(card => {

    const img = document.createElement("img");
    img.src = "cards/" + card;

    // 🔥 핵심 수정
    img.onclick = () => {

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

  const el = document.getElementById("captured");
  el.innerHTML = "";

  const captured = state.captured?.[myId] || [];

  captured.forEach(card => {

    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "35px";

    el.appendChild(img);
  });
}
