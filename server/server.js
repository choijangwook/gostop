const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const rooms = {};

function createCards() {

  const cards = [];

  for (let month = 1; month <= 12; month++) {

    cards.push({
      month,
      file: `${month}_junk1.png`
    });

    cards.push({
      month,
      file: `${month}_junk2.png`
    });

    cards.push({
      month,
      file: `${month}_animal.png`
    });

    cards.push({
      month,
      file: `${month}_ribbon.png`
    });
  }

  return cards.sort(() => Math.random() - 0.5);
}

io.on("connection", (socket) => {

  socket.on("createRoom", () => {

    const roomId =
      Math.random()
      .toString(36)
      .substring(2, 8);

    const deck = createCards();

    rooms[roomId] = {

      host: socket.id,
      guest: null,

      turn: socket.id,

      hostHand: deck.splice(0, 10),
      guestHand: deck.splice(0, 10),

      table: deck.splice(0, 8),

      hostCapture: [],
      guestCapture: []
    };

    socket.join(roomId);

    socket.emit("roomCreated", roomId);
  });

  socket.on("joinRoom", (roomId) => {

    const room = rooms[roomId];

    if (!room) return;

    room.guest = socket.id;

    socket.join(roomId);

    io.to(roomId).emit("startGame");

    sendState(roomId);
  });

  socket.on("playCard", ({ roomId, index }) => {

    const room = rooms[roomId];

    if (!room) return;

    if (room.turn !== socket.id) return;

    const isHost =
      socket.id === room.host;

    const hand =
      isHost
        ? room.hostHand
        : room.guestHand;

    const capture =
      isHost
        ? room.hostCapture
        : room.guestCapture;

    const card = hand[index];

    if (!card) return;

    // 같은 month 찾기
    const sameIndex =
      room.table.findIndex(
        c => c.month === card.month
      );

    if (sameIndex >= 0) {

      // 먹기
      capture.push(card);

      capture.push(
        room.table[sameIndex]
      );

      room.table.splice(sameIndex, 1);

    } else {

      // 바닥에 놓기
      room.table.push(card);
    }

    hand.splice(index, 1);

    room.turn =
      isHost
        ? room.guest
        : room.host;

    sendState(roomId);
  });

});

function sendState(roomId) {

  const room = rooms[roomId];

  io.to(room.host).emit("updateState", {

    myHand: room.hostHand,
    table: room.table,
    capture: room.hostCapture,
    turn: room.turn
  });

  io.to(room.guest).emit("updateState", {

    myHand: room.guestHand,
    table: room.table,
    capture: room.guestCapture,
    turn: room.turn
  });
}

const PORT =
  process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("서버 실행중");
});
