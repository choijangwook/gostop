let socket;
let myId = null;
let currentRoom = null;
let isBotGame = false;

/* =========================
   socket 초기화 (중요)
========================= */
socket = io();

/* =========================
   참가
========================= */

function joinRoom(){

  const room =
    document.getElementById("roomInput").value.trim();

  if(!room) return;

  currentRoom = room;

  socket.emit("joinRoom", room);

  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "flex";
}

/* =========================
   봇
========================= */

function playWithBot(){

  const room = "bot_" + Date.now();

  currentRoom = room;
  isBotGame = true;

  socket.emit("playWithBot", room);

  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "flex";
}

/* =========================
   다시 시작
========================= */

function restartGame(){

  if(!currentRoom) return;

  socket.emit("restartGame", currentRoom);
}

/* =========================
   나가기
========================= */

function leaveGame(){
  location.reload();
}

/* =========================
   카드
========================= */

function cardImage(card){
  return `cards/${card}`;
}

function getType(card){
  if(card.includes("bright")) return "bright";
  if(card.includes("animal")) return "animal";
  if(card.includes("ribbon")) return "ribbon";
  return "junk";
}

function getMonth(card){
  return parseInt(card.split("_")[0]) || 99;
}

function makeImage(card){
  const img = document.createElement("img");
  img.src = cardImage(card);
  img.draggable = false;
  return img;
}

/* =========================
   렌더
========================= */

function renderRow(id,cards){

  const el = document.getElementById(id);
  if(!el) return;

  el.innerHTML = "";
  cards.forEach(c => el.appendChild(makeImage(c)));
}

function renderHand(cards,myTurn){

  const el = document.getElementById("hand");
  el.innerHTML = "";

  cards.forEach(card=>{

    const img = makeImage(card);

    if(myTurn){
      img.onclick = () => {
        socket.emit("playCard",{
          room: currentRoom,
          card
        });
      };
    }

    el.appendChild(img);
  });
}

function renderEnemyHand(count){

  const el = document.getElementById("enemyHand");
  el.innerHTML = "";

  for(let i=0;i<count;i++){
    el.appendChild(makeImage("0-back.png"));
  }
}

/* =========================
   상태
========================= */

socket.on("gameState",(state)=>{

  myId = socket.id;

  const myTurn = state.turn === myId;

  document.getElementById("turn").innerText =
    myTurn ? "🟢 내 턴" : "⏳ 상대 턴";

  document.getElementById("deck").innerText =
    `남은패 : ${state.deck.length}`;

  renderHand(state.hands?.[myId] || [], myTurn);

  const enemyId =
    Object.keys(state.hands || []).find(id => id !== myId);

  renderEnemyHand(enemyId ? state.hands[enemyId].length : 0);

  renderRow("table", state.table || []);
  renderRow("myBrightAnimal", state.captured?.[myId] || []);
});

/* =========================
   종료
========================= */

socket.on("gameOver",(msg)=>{
  alert(msg);
});
