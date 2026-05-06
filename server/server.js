const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let rooms = {};

function createDeck() {
  const deck = [];

  for (let m = 1; m <= 12; m++) {
    deck.push({month:m, file:`${m}_junk1.png`});
    deck.push({month:m, file:`${m}_junk2.png`});
    deck.push({month:m, file:`${m}_ribbon.png`});
    deck.push({month:m, file:`${m}_animal.png`});
  }

  return deck.sort(() => Math.random() - 0.5);
}

function deal(deck) {
  return {
    players: [
      deck.splice(0, 10),
      deck.splice(0, 10)
    ],
    table: deck.splice(0, 8),
    draw: deck,
    turn: 0
  };
}

io.on("connection", (socket) => {

  socket.on("createRoom", () => {
    const roomId = Math.random().toString(36).substring(7);

    rooms[roomId] = {
      users: [socket.id],
      state: null
    };

    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });

  socket.on("joinRoom", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.users.push(socket.id);
    socket.join(roomId);

    const deck = createDeck();
    room.state = deal(deck);

    sendState(roomId);
  });

  socket.on("playCard", (index) => {
    const roomId = [...socket.rooms][1];
    const room = rooms[roomId];
    if (!room) return;

    const state = room.state;
    const playerIndex = room.users.indexOf(socket.id);

    if (state.turn !== playerIndex) return;

    const player = state.players[playerIndex];
    const card = player[index];

    const same = state.table.filter(c => c.month === card.month);

    if (same.length > 0) {
      state.table = state.table.filter(c => c.month !== card.month);
    } else {
      state.table.push(card);
    }

    player.splice(index, 1);
    state.turn = (state.turn + 1) % 2;

    sendState(roomId);
  });

});

function sendState(roomId) {
  const room = rooms[roomId];
  const state = room.state;

  room.users.forEach((id, i) => {
    io.to(id).emit("updateGame", {
      player: state.players[i],
      opponentCount: state.players[1 - i].length,
      table: state.table,
      turn: room.users[state.turn]
    });
  });
}

server.listen(process.env.PORT || 3000);
