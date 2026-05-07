const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
});

/* =========================
   상태 업데이트
========================= */

socket.on("stateUpdate", (s) => {

  state = s;

  render();
});

/* =========================
   렌더
========================= */

function render() {

  if (!state) return;

  /* =======================
     방번호 표시 (핵심 추가)
  ======================= */

  const status = document.getElementById("status");

  if (status) {

    status.innerHTML =
      "방번호 : " + state.roomId +
      " | " +
      (state.turn === myId ? "🟢 내 턴" : "⏳ 상대 턴");
  }

  /* =======================
     바닥패
  ======================= */

  const table = document.getElementById("table");
  table.innerHTML = "";

  (state.table || []).forEach(c => {

    const img = document.createElement("img");
    img.src = "cards/" + c;

    table.appendChild(img);
  });

  /* =======================
     내 패
  ======================= */

  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  const myHand = state.hands?.[myId] || [];

  myHand.forEach(c => {

    const img = document.createElement("img");
    img.src = "cards/" + c;

    img.onclick = () => {

      if (state.turn !== myId) return;

      socket.emit("playCard", {
        roomId: state.roomId,
        card: c
      });
    };

    hand.appendChild(img);
  });

  /* =======================
     먹은패
  ======================= */

  const cap = document.getElementById("captured");
  cap.innerHTML = "";

  const myCap = state.captured?.[myId] || [];

  myCap.forEach(c => {

    const img = document.createElement("img");
    img.src = "cards/" + c;

    cap.appendChild(img);
  });
}
