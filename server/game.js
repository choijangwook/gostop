class Game {
  constructor() {
    this.rooms = {};
  }

  createRoom(roomId) {
    this.rooms[roomId] = {
      players: {},
      turnOrder: [],
      turnIndex: 0,
      table: [],

      // 🔥 추가
      lock: false,
      scores: {},
      timer: null,
      turnTimeLimit: 15000,
    };
  }

  joinRoom(roomId, socketId) {
    const room = this.rooms[roomId];
    if (!room) return;

    room.players[socketId] = { hand: [] };
    room.turnOrder.push(socketId);
    room.scores[socketId] = 0;

    if (room.turnOrder.length === 1) {
      room.turnIndex = 0;
    }
  }

  getState(roomId) {
    return this.rooms[roomId];
  }

  isMyTurn(roomId, socketId) {
    const room = this.rooms[roomId];
    return room.turnOrder[room.turnIndex] === socketId;
  }

  // =========================
  // 🔥 카드 먹기 핵심 로직
  // =========================
  takeCard(roomId, socketId, cardId) {
    const room = this.rooms[roomId];
    if (!room) return;
    if (room.lock) return;
    if (!this.isMyTurn(roomId, socketId)) return;

    room.lock = true;

    const card = room.table.find(c => c.id === cardId);
    if (!card) {
      room.lock = false;
      return;
    }

    const player = room.players[socketId];
    if (!player) {
      room.lock = false;
      return;
    }

    // =========================
    // 🧠 매칭 로직 (같은 월 기준)
    // =========================
    const matched = room.table.filter(c => c.month === card.month);

    if (matched.length >= 2) {
      // 2장 이상이면 먹기 성공
      matched.forEach(m => {
        room.table = room.table.filter(x => x.id !== m.id);
      });

      player.hand.push(card);

      // 🔥 점수 증가 (임시 룰)
      room.scores[socketId] += 1;
    } else {
      // 실패 시 그냥 올려놓기
      room.table.push(card);
    }

    room.lock = false;
  }

  // =========================
  // 턴 종료 + 타이머 초기화
  // =========================
  endTurn(roomId) {
    const room = this.rooms[roomId];
    if (!room) return;

    room.turnIndex = (room.turnIndex + 1) % room.turnOrder.length;

    this.startTimer(roomId);
  }

  // =========================
  // ⏱ 턴 타이머
  // =========================
  startTimer(roomId) {
    const room = this.rooms[roomId];
    if (!room) return;

    if (room.timer) clearTimeout(room.timer);

    room.timer = setTimeout(() => {
      this.endTurn(roomId);
    }, room.turnTimeLimit);
  }
}

module.exports = new Game();
