const socket = io("https://gostop-server.onrender.com");

let myId;
let currentRoom;
let state;

// =========================
// 소리
// =========================

const clickSound = new Audio("sounds/card.mp3");
const captureSound = new Audio("sounds/capture.mp3");
const turnSound = new Audio("sounds/turn.mp3");
const bgm = new Audio("sounds/bgm.mp3");

bgm.loop = true;
bgm.volume = 0.3;

// =========================
// connect
// =========================

socket.on("connect", () => {

  myId = socket.id;

  localStorage.setItem("gid", myId);
});

// =========================
// join
// =========================

function joinRoom(roomId) {

  const room =
    roomId ||
    document.getElementById("roomInput").value;

  if (!room) return;

  currentRoom = room;

  socket.emit("joinRoom", {
    roomId: room
  });

  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "block";

  bgm.play().catch(()=>{});
}

// =========================
// state
// =========================

socket.on("stateUpdate", s => {

  state = s;

  renderHand();
  renderTable();

  const myTurn = state.turn === myId;

  document.getElementById("turn").innerText =
    myTurn ? "🟢 내 턴" : "⏳ 상대 턴";

  document.getElementById("deck").innerText =
    "남은패 : " + (state.deck?.length || 0);

  if (myTurn) {

    turnSound.currentTime = 0;
    turnSound.play();
  }

  if (state.lastCapture) {

    captureSound.currentTime = 0;
    captureSound.play();
  }
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

      if (state.turn !== myId) return;

      clickSound.currentTime = 0;
      clickSound.play();

      socket.emit("playCard", {
        roomId: currentRoom,
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
