// server/server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const game = require("./game");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../client")));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("createRoom", () => {
    const roomId = Math.random().toString(36).substring(7);

    rooms[roomId] = {
      players: [socket.id],
      state: null
    };

    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });

  socket.on("joinRoom", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.players.push(socket.id);
    socket.join(roomId);

    const deck = game.createDeck();
    room.state = game.dealCards(deck);

    io.to(roomId).emit("startGame", room.state);
  });

  socket.on("playCard", ({ roomId, cardIndex }) => {
    const room = rooms[roomId];
    if (!room) return;

    const state = room.state;

    const playerKey =
      socket.id === room.players[0] ? "player1" : "player2";

    if (state.turn !== playerKey) return;

    const hand = state[playerKey];
    const card = hand.splice(cardIndex, 1)[0];

    const result = game.match(card, state.table);
    state.table = result.table;

    if (playerKey === "player1") {
      state.captured1.push(...result.captured);
      state.turn = "player2";
    } else {
      state.captured2.push(...result.captured);
      state.turn = "player1";
    }

    io.to(roomId).emit("updateGame", state);
  });
});

server.listen(3000, () => {
  console.log("서버 실행");
});
