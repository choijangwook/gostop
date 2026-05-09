const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

/* =========================
   정적폴더
========================= */

app.use(
  express.static(
    path.join(__dirname,"../docs")
  )
);

/* =========================
   방 목록
========================= */

const rooms = {};

/* =========================
   카드 생성
========================= */

function createDeck(){

  const deck = [];

  const cards = [

    "1_bright.png",
    "1_ribbon.png",
    "1_junk1.png",
    "1_junk2.png",

    "2_animal.png",
    "2_ribbon.png",
    "2_junk1.png",
    "2_junk2.png",

    "3_bright.png",
    "3_ribbon.png",
    "3_junk1.png",
    "3_junk2.png",

    "4_animal.png",
    "4_ribbon.png",
    "4_junk1.png",
    "4_junk2.png",

    "5_animal.png",
    "5_ribbon.png",
    "5_junk1.png",
    "5_junk2.png",

    "6_animal.png",
    "6_ribbon.png",
    "6_junk1.png",
    "6_junk2.png",

    "7_animal.png",
    "7_ribbon.png",
    "7_junk1.png",
    "7_junk2.png",

    "8_bright.png",
    "8_animal.png",
    "8_junk1.png",
    "8_junk2.png",

    "9_animal.png",
    "9_ribbon.png",
    "9_junk1.png",
    "9_junk2.png",

    "10_animal.png",
    "10_ribbon.png",
    "10_junk1.png",
    "10_junk2.png",

    "11_bright.png",
    "11_junk1.png",
    "11_junk2.png",
    "11_junk3.png",

    "12_bright.png",
    "12_animal.png",
    "12_ribbon.png",
    "12_junk1.png",

    "special1_draw.png",
    "special2_draw.png",
    "special3_draw.png"
  ];

  deck.push(...cards);

  for(let i=deck.length-1;i>0;i--){

    const j =
      Math.floor(Math.random()*(i+1));

    [deck[i],deck[j]] =
      [deck[j],deck[i]];
  }

  return deck;
}

/* =========================
   월 추출
========================= */

function getMonth(card){

  const n =
    parseInt(card.split("_")[0]);

  return isNaN(n)
    ? "special"
    : n;
}

/* =========================
   게임 생성
========================= */

function createGame(players){

  const deck =
    createDeck();

  const hands = {};
  const captured = {};

  players.forEach(id=>{

    hands[id] = [];
    captured[id] = [];
  });

  const handCount = 10;

  players.forEach(id=>{

    for(let i=0;i<handCount;i++){

      hands[id].push(
        deck.pop()
      );
    }
  });

  const table = [];

  for(let i=0;i<8;i++){

    table.push(deck.pop());
  }

  return {

    players,

    deck,

    hands,

    table,

    captured,

    turn:
      players[
        Math.floor(
          Math.random()*players.length
        )
      ]
  };
}

/* =========================
   카드 플레이
========================= */

function playCard(game,playerId,card){

  if(game.turn !== playerId){

    return;
  }

  const hand =
    game.hands[playerId];

  const index =
    hand.indexOf(card);

  if(index === -1){

    return;
  }

  hand.splice(index,1);

  /* special */

  if(card.includes("special")){

    game.captured[playerId]
      .push(card);

    if(game.table.length > 0){

      const taken =
        game.table.pop();

      game.captured[playerId]
        .push(taken);
    }
  }
  else{

    const month =
      getMonth(card);

    const matchIndex =
      game.table.findIndex(
        c => getMonth(c) === month
      );

    if(matchIndex !== -1){

      const taken =
        game.table.splice(
          matchIndex,
          1
        )[0];

      game.captured[playerId]
        .push(card);

      game.captured[playerId]
        .push(taken);
    }
    else{

      game.table.push(card);
    }
  }

  /* 드로우 */

  if(game.deck.length > 0){

    const draw =
      game.deck.pop();

    if(draw.includes("special")){

      game.captured[playerId]
        .push(draw);

      if(game.table.length > 0){

        const taken =
          game.table.pop();

        game.captured[playerId]
          .push(taken);
      }
    }
    else{

      const month =
        getMonth(draw);

      const matchIndex =
        game.table.findIndex(
          c => getMonth(c) === month
        );

      if(matchIndex !== -1){

        const taken =
          game.table.splice(
            matchIndex,
            1
          )[0];

        game.captured[playerId]
          .push(draw);

        game.captured[playerId]
          .push(taken);
      }
      else{

        game.table.push(draw);
      }
    }
  }

  /* 턴 넘김 */

  const current =
    game.players.indexOf(playerId);

  game.turn =
    game.players[
      (current+1)
      %
      game.players.length
    ];

  /* 종료 */

  const finished =
    Object.values(game.hands)
      .every(h=>h.length===0);

  if(finished){

    let winner = null;
    let max = -1;

    game.players.forEach(id=>{

      const score =
        game.captured[id].length;

      if(score > max){

        max = score;
        winner = id;
      }
    });

    game.gameOver = true;
    game.winner = winner;
  }
}

/* =========================
   연결
========================= */

io.on("connection",(socket)=>{

  /* 참가 */

  socket.on("joinRoom",(room)=>{

    socket.join(room);

    if(!rooms[room]){

      rooms[room] = {
        waiting:true,
        players:[]
      };
    }

    const game =
      rooms[room];

    game.players =
      game.players.filter(
        id => id !== socket.id
      );

    if(!game.players.includes(socket.id)){

      game.players.push(socket.id);
    }

    if(game.players.length >= 2){

      const newGame =
        createGame(game.players);

      rooms[room] = newGame;

      io.to(room).emit(
        "gameState",
        newGame
      );
    }
  });

  /* 컴퓨터 대결 */

  socket.on("playWithBot",(room)=>{

    socket.join(room);

    const botId = "BOT";

    const newGame =
      createGame([
        socket.id,
        botId
      ]);

    rooms[room] = newGame;

    io.to(room).emit(
      "gameState",
      newGame
    );

    handleBot(room);
  });

  /* 카드 플레이 */

  socket.on("playCard",({room,card})=>{

    const game =
      rooms[room];

    if(!game) return;

    playCard(
      game,
      socket.id,
      card
    );

    io.to(room).emit(
      "gameState",
      game
    );

    if(game.gameOver){

      io.to(room).emit(
        "gameOver",
        game.winner === socket.id
          ? "승리!"
          : "패배!"
      );

      return;
    }

    handleBot(room);
  });

  /* 다시 시작 */

  socket.on("restartGame",(room)=>{

    const game =
      rooms[room];

    if(!game) return;

    const players =
      game.players || [];

    const newGame =
      createGame(players);

    rooms[room] = newGame;

    io.to(room).emit(
      "gameState",
      newGame
    );
  });

  /* 연결 종료 */

  socket.on("disconnect",()=>{

    Object.keys(rooms)
      .forEach(room=>{

        const game =
          rooms[room];

        if(!game.players) return;

        game.players =
          game.players.filter(
            id => id !== socket.id
          );
      });
  });
});

/* =========================
   봇
========================= */

function handleBot(room){

  const game =
    rooms[room];

  if(!game) return;

  if(game.turn !== "BOT"){

    return;
  }

  setTimeout(()=>{

    const hand =
      game.hands["BOT"];

    if(!hand || hand.length===0){

      return;
    }

    const card =
      hand[0];

    playCard(
      game,
      "BOT",
      card
    );

    io.to(room).emit(
      "gameState",
      game
    );

    if(game.gameOver){

      io.to(room).emit(
        "gameOver",
        game.winner === "BOT"
          ? "컴퓨터 승리!"
          : "당신 승리!"
      );
    }

  },700);
}

/* =========================
   서버 시작
========================= */

server.listen(3000,()=>{

  console.log(
    "server running"
  );
});
