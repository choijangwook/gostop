const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();

app.use(
  express.static(
    path.join(__dirname, "../docs")
  )
);

const server = http.createServer(app);

const io = new Server(server,{
  cors:{
    origin:"*"
  }
});

const rooms = {};

function createDeck(){

  const cards = [];

  for(let i=1;i<=12;i++){

    cards.push(`${i}_bright.png`);
    cards.push(`${i}_animal.png`);
    cards.push(`${i}_ribbon.png`);
    cards.push(`${i}_junk1.png`);
  }

  for(let i=cards.length-1;i>0;i--){

    const j =
      Math.floor(
        Math.random()*(i+1)
      );

    [cards[i],cards[j]] =
      [cards[j],cards[i]];
  }

  return cards;
}

function createRoom(roomId){

  const deck =
    createDeck();

  return {

    roomId,

    players:[],

    hands:{},
    captured:{},

    table:
      deck.splice(0,8),

    deck,

    turn:null
  };
}

function send(room){

  io.to(room.roomId)
    .emit(
      "stateUpdate",
      room
    );
}

function nextTurn(room){

  if(room.players.length < 2)
    return;

  room.turn =

    room.turn === room.players[0]
      ? room.players[1]
      : room.players[0];
}

function playCard(
  room,
  playerId,
  card
){

  if(room.turn !== playerId)
    return;

  const hand =
    room.hands[playerId];

  if(!hand)
    return;

  const idx =
    hand.indexOf(card);

  if(idx === -1)
    return;

  hand.splice(idx,1);

  const month =
    card.split("_")[0];

  const match =
    room.table.find(
      c =>
        c.split("_")[0]
        ===
        month
    );

  if(match){

    room.table =
      room.table.filter(
        c => c !== match
      );

    room.captured[playerId]
      .push(card);

    room.captured[playerId]
      .push(match);

  }else{

    room.table.push(card);
  }

  if(room.deck.length > 0){

    room.table.push(
      room.deck.pop()
    );
  }

  nextTurn(room);

  send(room);
}

io.on(
  "connection",
  socket=>{

    console.log(
      "connected:",
      socket.id
    );

    socket.on(
      "joinRoom",
      roomId=>{

        let room =
          rooms[roomId];

        if(!room){

          room =
            createRoom(roomId);

          rooms[roomId] =
            room;
        }

        socket.join(roomId);

        if(
          !room.players.includes(
            socket.id
          )
        ){

          room.players.push(
            socket.id
          );
        }

        if(
          !room.hands[socket.id]
        ){

          room.hands[socket.id] = [];
          room.captured[socket.id] = [];

          for(let i=0;i<10;i++){

            room.hands[socket.id]
              .push(
                room.deck.pop()
              );
          }
        }

        if(!room.turn){

          room.turn =
            room.players[0];
        }

        send(room);
      }
    );

    socket.on(
      "playCard",
      data=>{

        const room =
          rooms[data.roomId];

        if(!room)
          return;

        playCard(
          room,
          socket.id,
          data.card
        );
      }
    );

    socket.on(
      "restartGame",
      roomId=>{

        const room =
          rooms[roomId];

        if(!room)
          return;

        const deck =
          createDeck();

        room.deck = deck;

        room.table =
          deck.splice(0,8);

        room.hands = {};
        room.captured = {};

        room.players.forEach(id=>{

          room.hands[id] = [];
          room.captured[id] = [];

          for(let i=0;i<10;i++){

            room.hands[id]
              .push(
                room.deck.pop()
              );
          }
        });

        room.turn =
          room.players[0];

        send(room);
      }
    );
  }
);

server.listen(
  10000,
  "0.0.0.0",
  ()=>{

    console.log(
      "server running"
    );

    console.log(
      "http://192.168.219.103:10000"
    );
  }
);
