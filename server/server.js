const express = require("express");
    // =========================
    captureCard(room, socket.id, card);

    // =========================
    // 드로우
    // =========================
    const drawCard = room.deck.shift();

    if (drawCard) {

      // 드로우 카드 먹기 처리
      captureCard(room, socket.id, drawCard);
    }

    // =========================
    // 턴 변경
    // =========================
    nextTurn(room);

    emitState(roomId);
  });

  // =========================
  // 연결 종료
  // =========================
  socket.on("disconnect", () => {

    for (const roomId in rooms) {

      const room = rooms[roomId];

      room.players =
        room.players.filter(id => id !== socket.id);

      delete room.hands[socket.id];
      delete room.captured[socket.id];

      if (room.turn === socket.id) {

        room.turnIndex = 0;

        room.turn = room.players[0] || null;
      }

      if (room.players.length === 0) {
        delete rooms[roomId];
      }
    }

    console.log("퇴장:", socket.id);
  });

});

// =========================
server.listen(10000, () => {
  console.log("🎴 Gostop 서버 실행중");
});
