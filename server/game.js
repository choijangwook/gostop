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
      lock: false,
    };
  }

  joinRoom(roomId, socketId) {
    const room = this.rooms[roomId];
    if (!room) return;

    room.players[socketId] = {
      hand: [],
    };

    if (!room.turnOrder.includes(socketId)) {
      room.turnOrder.push(socketId);
    }

    if (room.turnOrder.length === 1) {
      room.turnIndex = 0;
    }
  }

  getState(roomId) {
    return this.rooms[roomId];
  }

  isMyTurn(roomId, socketId) {
    const room = this.rooms[roomId];
    if (!room) return false;

    return room.turnOrder[room.turnIndex] === socketId;
  }

  takeCard(roomId, socketId, cardId) {
    const room = this.rooms[roomId];
    if (!room) return;

    // 🔥 핵심: 서버만 판단
    if (!this.isMyTurn(roomId, socketId)) return;
    if (room.lock) return;

    room.lock = true;

    const card = room.table.find(c => c.id === cardId);
    if (!card) {
      room.lock = false;
      return;
    }

    // 바닥패 제거
    room.table = room.table.filter(c => c.id !== cardId);

    // 손패 추가
    const player = room.players[socketId];
    if (player) {
      player.hand.push(card);
    }

    room.lock = false;
  }

  endTurn(roomId) {
    const room = this.rooms[roomId];
    if (!room) return;

    room.turnIndex = (room.turnIndex + 1) % room.turnOrder.length;
  }
}

module.exports = new Game();
