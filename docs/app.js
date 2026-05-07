const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;
let selected = null;

socket.on("connect", () => {
  myId = socket.id;
});

function joinRoom() {
  const roomId = Number(document.getElementById("roomInput").value);

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
function renderTable() {

  const el = document.getElementById("table");
  el.innerHTML = "";

  state.table.forEach(card => {

    const img = document.createElement("img");
    img.src = "cards/" + card;

    img.onclick = () => {
      if (!selected) return;

      socket.emit("takeCard", {
        roomId: state.roomId,
        tableCard: card
      });

      selected = null;
    };

    el.appendChild(img);
  });
}

// =========================
function renderHand() {

  const el = document.getElementById("hand");
  el.innerHTML = "";

  const hand = state.hands?.[myId] || [];

  hand.forEach(card => {

    const img = document.createElement("img");
    img.src = "cards/" + card;

    img.onclick = () => {
      selected = card;

      socket.emit("selectHand", {
        roomId: state.roomId,
        card
      });
    };

    el.appendChild(img);
  });
}

// =========================
function renderCaptured() {

  const el = document.getElementById("captured");
  el.innerHTML = "";

  const list = state.captured?.[myId] || [];

  list.forEach(card => {
    const img = document.createElement("img");
    img.src = "cards/" + card;
    img.style.width = "35px";
    el.appendChild(img);
  });
}
