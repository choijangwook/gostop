class Game {
  constructor() {
    this.rooms = {}; 
  }

  createRoom(roomId) {
    this.rooms[roomId] = {
      players: {},     // socketId: playerData
      turnOrder: [],   // socketId 순서
      turnIndex: 0,
      table: [],
    };
  }

  joinRoom(roomId, socketId) {
    const room = this.rooms[roomId];
    if (!room) return;

    room.players[socketId] = {
      hand: [],
    };

    room.turnOrder.push(socketId);

    // 첫 플레이어 턴 설정
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

    // 🔥 핵심: 턴 검증 (서버만 권한)
    if (!this.isMyTurn(roomId, socketId)) return;

    // 바닥패에서 제거
    room.table = room.table.filter(c => c.id !== cardId);

    // 플레이어 손패로 이동
    const player = room.players[socketId];
    if (player) {
      player.hand.push({ id: cardId });
    }
  }

  endTurn(roomId) {
    const room = this.rooms[roomId];
    if (!room) return;

    room.turnIndex = (room.turnIndex + 1) % room.turnOrder.length;
  }
}

module.exports = new Game();
