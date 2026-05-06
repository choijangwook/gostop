const socket = io("https://gostop-server.onrender.com");

let state = null;

let captured = [];
let aiCaptured = [];

let score = 0;
let aiScore = 0;

let goCount = 0;
let aiGoCount = 0;

let playerTurn = true;
let gameOver = false;

function createRoom() {
  socket.emit("createRoom");
}

function joinRoom() {
  const roomId = document.getElementById("roomInput").value;
  socket.emit("joinRoom", roomId);
}

socket.on("startGame", (gameState) => {
  state = gameState;

  state.ai = state.draw.splice(0, 10);

  captured = [];
  aiCaptured = [];
  score = 0;
  aiScore = 0;
  goCount = 0;
  aiGoCount = 0;
  gameOver = false;

  render();
});

/* 🔥 플레이어 턴 */
function playCard(index) {
  if (!playerTurn || gameOver) return;

  const card = state.player1[index];
  processTurn(card, true);
  state.player1.splice(index, 1);

  drawCard(true);
  updateScore();

  if (checkEnd(true)) return;

  playerTurn = false;
  render();

  setTimeout(aiTurn, 800);
}

/* 🔥 AI 턴 */
function aiTurn() {
  if (gameOver) return;

  let index = state.ai.findIndex(c =>
    state.table.some(t => t.month === c.month)
  );

  if (index === -1) index = Math.floor(Math.random() * state.ai.length);

  const card = state.ai[index];

  processTurn(card, false);
  state.ai.splice(index, 1);

  drawCard(false);
  updateScore();

  if (checkEnd(false)) return;

  playerTurn = true;
  render();
}

/* 🔥 카드 처리 */
function processTurn(card, isPlayer) {
  const target = isPlayer ? captured : aiCaptured;
  const same = state.table.filter(c => c.month === card.month);

  if (same.length >= 1) {
    target.push(card, ...same);
    state.table = state.table.filter(c => c.month !== card.month);
  } else {
    state.table.push(card);
  }
}

/* 🔥 뽑기 */
function drawCard(isPlayer) {
  if (state.draw.length === 0) return;

  const card = state.draw.shift();
  const target = isPlayer ? captured : aiCaptured;

  const same = state.table.filter(c => c.month === card.month);

  if (same.length > 0) {
    target.push(card, ...same);
    state.table = state.table.filter(c => c.month !== card.month);
  } else {
    state.table.push(card);
  }
}

/* 🔥 점수 계산 */
function calc(cards) {
  let bright = cards.filter(c => c.file.includes("bright")).length;
  let animal = cards.filter(c => c.file.includes("animal")).length;
  let ribbon = cards.filter(c => c.file.includes("ribbon")).length;
  let junk = cards.filter(c => c.file.includes("junk")).length;

  let s = 0;

  if (bright === 3) s += 3;
  if (bright === 4) s += 4;
  if (bright === 5) s += 15;

  if (animal >= 5) s += (animal - 4);
  if (ribbon >= 5) s += (ribbon - 4);
  if (junk >= 10) s += (junk - 9);

  return s;
}

function updateScore() {
  score = calc(captured);
  aiScore = calc(aiCaptured);
}

/* 🔥 종료 + GO/STOP */
function checkEnd(isPlayer) {
  let s = isPlayer ? score : aiScore;

  if (s >= 3) {
    if (isPlayer) {
      const go = confirm(`현재 ${s}점\nGO 할까?`);

      if (go) {
        goCount++;
        score += goCount;
      } else {
        endGame(true);
        return true;
      }
    } else {
      // AI 판단
      if (s < 7) {
        aiGoCount++;
        aiScore += aiGoCount;
      } else {
        endGame(false);
        return true;
      }
    }
  }

  return false;
}

/* 🔥 승패 판정 + 배수 */
function endGame(playerWin) {
  gameOver = true;

  let finalScore = playerWin ? score : aiScore;

  let multiplier = 1;

  // 광박
  if (captured.filter(c => c.file.includes("bright")).length >= 3) {
    multiplier *= 2;
  }

  // 피박
  const opponentJunk = playerWin
    ? aiCaptured.filter(c => c.file.includes("junk")).length
    : captured.filter(c => c.file.includes("junk")).length;

  if (opponentJunk < 6) multiplier *= 2;

  finalScore *= multiplier;

  alert(
    playerWin
      ? `🎉 승리!\n점수: ${finalScore}`
      : `💀 패배\n점수: ${finalScore}`
  );

  render();
}

/* 🔥 렌더링 */
function render() {
  const game = document.getElementById("game");

  game.innerHTML = `
    <h3>내 카드</h3>
    ${state.player1.map((c, i) => `
      <img src="cards/${c.file}" onclick="playCard(${i})">
    `).join("")}

    <h3>AI 카드 (${state.ai.length})</h3>
    ${Array(state.ai.length).fill('🂠').join("")}

    <h3>바닥</h3>
    ${state.table.map(c => `
      <img src="cards/${c.file}">
    `).join("")}

    <h3>내 점수: ${score} (GO:${goCount})</h3>
    <h3>AI 점수: ${aiScore} (GO:${aiGoCount})</h3>

    <h3>내 먹은 카드 (${captured.length})</h3>
    ${captured.map(c => `<img src="cards/${c.file}">`).join("")}

    <h3>AI 먹은 카드 (${aiCaptured.length})</h3>
    ${aiCaptured.map(c => `<img src="cards/${c.file}">`).join("")}

    ${gameOver ? "<h2>게임 종료</h2>" : ""}
  `;
}
