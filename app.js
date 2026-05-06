const socket = io("https://gostop-server.onrender.com");

let state = null;
let captured = []; // 먹은 카드

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

/* 🔥 핵심 룰 처리 */
function playCard(index) {
  const card = state.player1[index];

  const sameMonth = state.table.filter(c => c.month === card.month);

  // 🔥 1. 폭탄 (3장)
  if (sameMonth.length === 3) {
    captured.push(card, ...sameMonth);
    state.table = state.table.filter(c => c.month !== card.month);
    alert("💣 폭탄!");
  }

  // 🔥 2. 따닥 (2장)
  else if (sameMonth.length === 2) {
    captured.push(card, ...sameMonth);
    state.table = state.table.filter(c => c.month !== card.month);
    alert("🔥 따닥!");
  }

  // 🔥 3. 쌍 (1장)
  else if (sameMonth.length === 1) {
    captured.push(card, sameMonth[0]);
    state.table = state.table.filter(c => c !== sameMonth[0]);
    alert("👊 쌍!");
  }

  // 🔥 4. 없음 → 바닥에 카드 놓기
  else {
    state.table.push(card);

    // 🔥 쪽 / 끗 판단 (같은 월 2장 생성 체크)
    const after = state.table.filter(c => c.month === card.month);

    if (after.length === 2) {
      alert("⚡ 쪽!");
    } else {
      alert("😐 끗");
    }
  }

  // 카드 제거
  state.player1.splice(index, 1);

  // 🔥 보너스: 한 장 뽑기 (draw)
  if (state.draw.length > 0) {
    const drawCard = state.draw.shift();
    processDraw(drawCard);
  }

  render();
}

/* 🔥 뽑기 처리 */
function processDraw(card) {
  const sameMonth = state.table.filter(c => c.month === card.month);

  if (sameMonth.length > 0) {
    captured.push(card, ...sameMonth);
    state.table = state.table.filter(c => c.month !== card.month);
    alert(`🎯 뽑기 성공 (${card.month})`);
  } else {
    state.table.push(card);
  }
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
  `;
}
