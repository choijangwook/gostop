console.log("THIS IS NEW SERVER FILE");

const express = require("express");


const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "../docs")));

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const rooms = {};

function createDeck() {

  const cards = [];

  for (let i = 1; i <= 12; i++) {

    cards.push(`${i}_bright.png`);
    cards.push(`${i}_animal.png`);
    cards.push(`${i}_ribbon.png`);
    cards.push(`${i}_junk1.png`);
  }

  cards.push("special1_draw.png");
  cards.push("special2_draw.png");
  cards.push("special3_draw.png");

  for (let i = cards.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [cards[i], cards[j]] =
      [cards[j], cards[i]];
  }

  return cards;
}

function createRoom(roomId) {

  const deck = createDeck();

  return {

    roomId,

    players: [],
    hands: {},
    captured: {},
    roles: {},

    table: deck.splice(0, 8),

    deck,

    turn: "A"
  };
}

function send(room) {

  io.to(room.roomId).emit("stateUpdate", {

    roomId: room.roomId,

    players: room.players,
    hands: room.hands,
    captured: room.captured,
    roles: room.roles,

    table: room.table,
    deck: room.deck,

    turn: room.turn
  });
}

function nextTurn(room) {

  room.turn =
    room.turn === "A"
      ? "B"
      : "A";
}

function play(room, playerId, card) {

  const hand =
    room.hands[playerId];

  if (!hand) return;

  const idx =
    hand.indexOf(card);

  if (idx === -1) return;

  hand.splice(idx, 1);

  const month =
    card.split("_")[0];

  const match =
    room.table.find(
      c =>
        c.split("_")[0]
        ===
        month
    );

  if (match) {

    room.table =
      room.table.filter(
        c => c !== match
      );

    room.captured[playerId]
      .push(card);

    room.captured[playerId]
      .push(match);

  } else {

    room.table.push(card);
  }

  if (room.deck.length > 0) {

    room.table.push(
      room.deck.pop()
    );
  }

  nextTurn(room);

  send(room);
}

io.on("connection", socket => {

  console.log("connect:", socket.id);

  socket.on("joinRoom", data => {

    const roomId =
      String(data.roomId);

    let room =
      rooms[roomId];

    if (!room) {

      room =
        createRoom(roomId);

      rooms[roomId] =
        room;
    }

    socket.join(roomId);

    if (
      !room.players.includes(
        socket.id
      )
    ) {

      room.players.push(
        socket.id
      );
    }

    if (
      !room.roles[socket.id]
    ) {

      room.roles[socket.id] =
        room.players.length === 1
          ? "A"
          : "B";
    }

    if (
      !room.hands[socket.id]
    ) {

      room.hands[socket.id] = [];
      room.captured[socket.id] = [];

      for (let i = 0; i < 10; i++) {

        room.hands[socket.id]
          .push(
            room.deck.pop()
          );
      }
    }

    send(room);
  });

  socket.on("playCard", data => {

    const room =
      rooms[data.roomId];

    if (!room) return;

    if (
      room.roles[socket.id]
      !==
      room.turn
    ) {
      return;
    }

    play(
      room,
      socket.id,
      data.card
    );
  });

  socket.on("restart", data => {

    const room =
      rooms[data.roomId];

    if (!room) return;

    rooms[data.roomId] =
      createRoom(data.roomId);

    const newRoom =
      rooms[data.roomId];

    room.players.forEach((id, index) => {

      newRoom.players.push(id);

      newRoom.roles[id] =
        index === 0
          ? "A"
          : "B";

      newRoom.hands[id] = [];
      newRoom.captured[id] = [];

      for (let i = 0; i < 10; i++) {

        newRoom.hands[id]
          .push(
            newRoom.deck.pop()
          );
      }
    });

    send(newRoom);
  });

  socket.on("leaveRoom", data => {

    const room =
      rooms[data.roomId];

    if (!room) return;

    room.players =
      room.players.filter(
        p => p !== socket.id
      );

    delete room.roles[socket.id];
    delete room.hands[socket.id];
    delete room.captured[socket.id];

    socket.leave(data.roomId);

    send(room);
  });
});

server.listen(
  10000,
  "0.0.0.0",
  () => {

    console.log(
      "server running"
    );

    console.log(
      "http://192.168.219.103:10000"
    );
  }
);
