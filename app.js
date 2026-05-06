const socket = io("https://gostop-server.onrender.com");

let state = null;
let captured = [];
let score = 0;
let goCount = 0;

function createRoom() {
  socket.emit("createRoom");
}

function joinRoom() {
  const roomId = document.getElementById("roomInput").value;
  socket.emit("joinRoom", roomId);
}

socket.on("roomCreated", (roomId) => {
  alert("방 코드: " + roomId);
});

socket.on("startGame", (gameState) => {
  state = gameState;
  render();
});

/* 🔥 카드 플레이 */
function playCard(index) {
  const card = state.player1[index];
  const same = state.table.filter(c => c.month === card.month);

  // 폭탄
  if (same.length === 3) {
    captured.push(card, ...same);
    state.table = state.table.filter(c => c.month !== card.month);
    alert("💣 폭탄!");
  }

  // 따닥
  else if (same.length === 2) {
    captured.push(card, ...same);
    state.table = state.table.filter(c => c.month !== card.month);
    alert("🔥 따닥!");
  }

  // 쌍
  else if (same.length === 1) {
    captured.push(card, same[0]);
    state.table = state.table.filter(c => c !== same[0]);
    alert("👊 쌍!");
  }

  // 없음
  else {
    state.table.push(card);

    const after = state.table.filter(c => c.month === card.month);

    if (after.length === 2) alert("⚡ 쪽!");
    else alert("😐 끗");
  }

  state.player1.splice(index, 1);

  // 뽑기
  if (state.draw.length > 0) {
    const drawCard = state.draw.shift();
    processDraw(drawCard);
  }

  updateScore();
  render();
}

/* 🔥 뽑기 처리 */
function processDraw(card) {
  const same = state.table.filter(c => c.month === card.month);

  if (same.length > 0) {
    captured.push(card, ...same);
    state.table = state.table.filter(c => c.month !== card.month);
    alert(`🎯 뽑기 성공 (${card.month})`);
  } else {
    state.table.push(card);
  }
}

/* 🔥 점수 계산 */
function updateScore() {
  let bright = captured.filter(c => c.file.includes("bright")).length;
  let animal = captured.filter(c => c.file.includes("animal")).length;
  let ribbon = captured.filter(c => c.file.includes("ribbon")).length;
  let junk = captured.filter(c => c.file.includes("junk")).length;

  score = 0;

  // 광
  if (bright === 3) score += 3;
  if (bright === 4) score += 4;
  if (bright === 5) score += 15;

  // 열끗
  if (animal >= 5) score += (animal - 4);

  // 띠
  if (ribbon >= 5) score += (ribbon - 4);

  // 피
  if (junk >= 10) score += (junk - 9);

  checkGoStop();
}

/* 🔥 고 / 스톱 */
function checkGoStop() {
  if (score >= 3) {
    setTimeout(() => {
      const go = confirm(`현재 점수 ${score}점\nGO 할까? (취소=STOP)`);

      if (go) {
        goCount++;
        score += goCount; // 고 보너스
        alert(`GO! (${goCount}번)`);
      } else {
        alert(`🎉 STOP! 최종 점수: ${score}`);
        resetGame();
      }
    }, 100);
  }
}

/* 🔥 게임 리셋 */
function resetGame() {
  captured = [];
  score = 0;
  goCount = 0;
  state = null;
  document.getElementById("game").innerHTML = "<h2>게임 종료</h2>";
}

/* 🔥 렌더링 */
function render() {
  const game = document.getElementById("game");

  game.innerHTML = `
    <h3>내 카드</h3>
    ${state.player1.map((c, i) => `
      <img src="cards/${c.file}" onclick="playCard(${i})">
    `).join("")}

    <h3>바닥</h3>
    ${state.table.map(c => `
      <img src="cards/${c.file}">
    `).join("")}

    <h3>먹은 카드 (${captured.length})</h3>
    ${captured.map(c => `
      <img src="cards/${c.file}">
    `).join("")}

    <h3>점수: ${score}점 (GO: ${goCount})</h3>
  `;
}
