const socket = io();

let myId = null;
let currentRoom = null;
let isBotGame = false;

/* =========================
   참가
========================= */

function joinRoom(){

  const room =
    document
      .getElementById("roomInput")
      .value
      .trim();

  if(!room) return;

  currentRoom = room;

  socket.emit("joinRoom", room);

  document.getElementById("lobby").style.display = "none";

  /* 핵심 수정 */
  const game =
    document.getElementById("game");

  game.style.display = "flex";
  game.style.flexDirection = "column";
}

/* =========================
   컴퓨터 대결
========================= */

function playWithBot(){

  const room =
    "bot_" + Date.now();

  currentRoom = room;

  isBotGame = true;

  socket.emit("playWithBot", room);

  document.getElementById("lobby").style.display = "none";

  /* 핵심 수정 */
  const game =
    document.getElementById("game");

  game.style.display = "flex";
  game.style.flexDirection = "column";
}

/* =========================
   다시 시작
========================= */

function restartGame(){

  if(!currentRoom) return;

  socket.emit(
    "restartGame",
    currentRoom
  );
}

/* =========================
   나가기
========================= */

function leaveGame(){

  location.reload();
}

/* =========================
   카드 이미지
========================= */

function cardImage(card){

  return `cards/${card}`;
}

/* =========================
   카드 타입
========================= */

function getType(card){

  if(card.includes("bright")){

    return "bright";
  }

  if(card.includes("animal")){

    return "animal";
  }

  if(card.includes("ribbon")){

    return "ribbon";
  }

  return "junk";
}

/* =========================
   카드 월
========================= */

function getMonth(card){

  return parseInt(
    card.split("_")[0]
  ) || 99;
}

/* =========================
   정렬
========================= */

function sortCards(cards){

  return [...cards].sort((a,b)=>{

    const order = {
      bright:0,
      animal:1,
      ribbon:2,
      junk:3
    };

    const ta = order[getType(a)];
    const tb = order[getType(b)];

    if(ta !== tb){

      return ta - tb;
    }

    return getMonth(a)-getMonth(b);
  });
}

/* =========================
   이미지 생성
========================= */

function makeImage(card){

  const img =
    document.createElement("img");

  img.src = cardImage(card);

  img.draggable = false;

  return img;
}

/* =========================
   일반 줄 렌더
========================= */

function renderRow(id,cards){

  const el =
    document.getElementById(id);

  if(!el) return;

  el.innerHTML = "";

  cards.forEach(card=>{

    el.appendChild(
      makeImage(card)
    );
  });
}

/* =========================
   먹은패 렌더
========================= */

function renderCaptured(id1,id2,id3,cards){

  cards = sortCards(cards);

  const brightAnimal = [];
  const ribbon = [];
  const junk = [];

  cards.forEach(card=>{

    const type =
      getType(card);

    if(
      type==="bright" ||
      type==="animal"
    ){

      brightAnimal.push(card);
    }
    else if(type==="ribbon"){

      ribbon.push(card);
    }
    else{

      junk.push(card);
    }
  });

  renderRow(id1,brightAnimal);
  renderRow(id2,ribbon);
  renderRow(id3,junk);
}

/* =========================
   내패 렌더
========================= */

function renderHand(cards,myTurn){

  const hand =
    document.getElementById("hand");

  if(!hand) return;

  hand.innerHTML = "";

  cards.forEach(card=>{

    const img =
      makeImage(card);

    if(myTurn){

      img.onclick = ()=>{

        socket.emit(
          "playCard",
          {
            room:currentRoom,
            card
          }
        );
      };
    }

    hand.appendChild(img);
  });
}

/* =========================
   상대패
========================= */

function renderEnemyHand(count){

  const enemy =
    document.getElementById("enemyHand");

  if(!enemy) return;

  enemy.innerHTML = "";

  for(let i=0;i<count;i++){

    const img =
      makeImage("0-back.png");

    enemy.appendChild(img);
  }
}

/* =========================
   상태 갱신
========================= */

socket.on("gameState",(state)=>{

  myId = socket.id;

  const myTurn =
    state.turn === myId;

  /* 턴 */

  document.getElementById("turn").innerHTML =
    myTurn
      ? "🟢 내 턴"
      : "⏳ 상대 턴";

  /* 남은패 */

  document.getElementById("deck").innerHTML =
    `남은패 : ${state.deck.length}`;

  /* 내패 */

  renderHand(
    state.hands?.[myId] || [],
    myTurn
  );

  /* 상대 */

  const enemyId =
    Object.keys(state.hands || {})
      .find(id=>id!==myId);

  const enemyCount =
    enemyId
      ? state.hands[enemyId].length
      : 0;

  /* 상대패 */

  renderEnemyHand(enemyCount);

  /* 바닥패 */

  renderRow(
    "table",
    state.table || []
  );

  /* 내 먹은패 */

  renderCaptured(
    "myBrightAnimal",
    "myRibbon",
    "myJunk",
    state.captured?.[myId] || []
  );

  /* 상대 먹은패 */

  renderCaptured(
    "enemyBrightAnimal",
    "enemyRibbon",
    "enemyJunk",
    enemyId
      ? state.captured?.[enemyId] || []
      : []
  );
});

/* =========================
   게임 종료
========================= */

socket.on("gameOver",(msg)=>{

  alert(msg);
});

/* =========================
   재시작
========================= */

socket.on("restartGame",()=>{

  socket.emit(
    isBotGame
      ? "playWithBot"
      : "joinRoom",
    currentRoom
  );
});
