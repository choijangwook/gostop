const socket = io("https://gostop-server.onrender.com");

let currentRoom = null;

// =========================
// 방 참가 (핵심 기능)
// =========================
function joinRoom() {
  const roomId = document.getElementById("roomInput").value;

  if (!roomId) return;

  const numRoom = Number(roomId);

  if (numRoom < 100 || numRoom > 999) {
    alert("3자리 숫자만 가능합니다 (100~999)");
    return;
  }

  socket.emit("joinRoom", {
    roomId: numRoom
  });

  currentRoom = numRoom;

  document.getElementById("roomId").innerText = numRoom;
}

// =========================
// 서버 상태 확인
// =========================
socket.on("stateUpdate", (state) => {
  console.log("room state:", state);
});
