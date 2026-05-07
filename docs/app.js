const socket = io("https://gostop-server.onrender.com");

let state = null;
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
});

/* ===================== */
socket.on("stateUpdate", (s) => {

  state = s;

  render();
});

/* ===================== */
function render() {

  if (!state) return;

  document.getElementById("status").innerText =
    state.turn === myId ? "내 턴" : "상대 턴";

  /* table */
  const table = document.getElementById("table");
  table.innerHTML = "";

  (state.table || []).forEach(c => {
    const img = document.createElement("img");
    img.src = "cards/" + c;
    table.appendChild(img);
  });

  /* hand */
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

  /* captured */
  const cap = document.getElementById("captured");
  cap.innerHTML = "";

  const myCap = state.captured?.[myId] || [];

  myCap.forEach(c => {

    const img = document.createElement("img");
    img.src = "cards/" + c;

    cap.appendChild(img);
  });
}
