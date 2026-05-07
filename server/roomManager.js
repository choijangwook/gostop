const game = require("./game");

class RoomManager {
  createRoom(roomId) {
    game.createRoom(roomId);
  }

  joinRoom(roomId, socketId) {
    game.joinRoom(roomId, socketId);
  }

  getState(roomId) {
    return game.getState(roomId);
  }

  takeCard(roomId, socketId, cardId) {
    game.takeCard(roomId, socketId, cardId);
  }

  endTurn(roomId) {
    game.endTurn(roomId);
  }
}

module.exports = new RoomManager();
