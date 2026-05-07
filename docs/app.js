const socket = io("https://gostop-server.onrender.com");

let currentRoom = "";

console.log("app.js 정상 로드됨");

socket.on("connect", () => {
  console.log("서버 연결됨:", socket.id);
});

function createRoom() {
  console.log("방 만들기 클릭");
  socket.emit("createRoom");
}

function joinRoom() {
  const roomId = document.getElementById("roomInput").value;

  console.log("참가 시도:", roomId);

  if (!roomId) {
    alert("방 코드를 입력하세요");
    return;
  }

  socket.emit("joinRoom", roomId);
}

socket.on("roomCreated", (roomId) => {

  console.log("방 생성 완료:", roomId);

  currentRoom = roomId;

  document.getElementById("roomInput").value = roomId;

  alert("방 코드: " + roomId);
});

socket.on("startGame", () => {
  alert("게임 시작!");
});
