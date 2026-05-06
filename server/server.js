const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let rooms = {};

/* 🔥 48장 카드 생성 */
function createDeck() {
  const deck = [
    {month:1,file:"1_bright.png"},
    {month:1,file:"1_ribbon.png"},
    {month:1,file:"1_junk1.png"},
    {month:1,file:"1_junk2.png"},

    {month:2,file:"2_animal.png"},
    {month:2,file:"2_ribbon.png"},
    {month:2,file:"2_junk1.png"},
    {month:2,file:"2_junk2.png"},

    {month:3,file:"3_bright.png"},
    {month:3,file:"3_ribbon.png"},
    {month:3,file:"3_junk1.png"},
    {month:3,file:"3_junk2.png"},

    {month:4,file:"4_animal.png"},
    {month:4,file:"4_ribbon.png"},
    {month:4,file:"4_junk1.png"},
    {month:4,file:"4_junk2.png"},

    {month:5,file:"5_animal.png"},
    {month:5,file:"5_ribbon.png"},
    {month:5,file:"5_junk1.png"},
    {month:5,file:"5_junk2.png"},

    {month:6,file:"6_animal.png"},
    {month:6,file:"6_ribbon.png"},
    {month:6,file:"6_junk1.png"},
    {month:6,file:"6_junk2.png"},

    {month:7,file:"7_animal.png"},
    {month:7,file:"7_ribbon.png"},
    {month:7,file:"7_junk1.png"},
    {month:7,file:"7_junk2.png"},

    {month:8,file:"8_bright.png"},
    {month:8,file:"8_animal.png"},
    {month:8,file:"8_junk1.png"},
    {month:8,file:"8_junk2.png"},

    {month:9,file:"9_animal.png"},
    {month:9,file:"9_ribbon.png"},
    {month:9,file:"9_junk1.png"},
    {month:9,file:"9_junk2.png"},

    {month:10,file:"10_animal.png"},
    {month:10,file:"10_ribbon.png"},
    {month:10,file:"10_junk1.png"},
    {month:10,file:"10_junk2.png"},

    {month:11,file:"11_bright.png"},
    {month:11,file:"11_junk1.png"},
    {month:11,file:"11_junk2.png"},
    {month:11,file:"11_junk3.png"},

    {month:12,file:"12_bright.png"},
    {month:12,file:"12_animal.png"},
    {month:12,file:"12_junk1.png"},
    {month:12,file:"12_junk2.png"}
  ];

  return deck.sort(() => Math.random() - 0.5);
}

function deal(deck) {
  return {
    player1: deck.splice(0, 10),
    table: deck.splice(0, 8),
    draw: deck
  };
}

io.on("connection", (socket) => {

  socket.on("createRoom", () => {
    const roomId = Math.random().toString(36).substring(7);

    const deck = createDeck();

    rooms[roomId] = {
      state: deal(deck)
    };

    socket.join(roomId);

    socket.emit("roomCreated", roomId);
    socket.emit("startGame", rooms[roomId].state);
  });

  socket.on("joinRoom", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    socket.join(roomId);
    io.to(roomId).emit("startGame", room.state);
  });

});

server.listen(process.env.PORT || 3000);
