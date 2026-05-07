const socket =
    const img =
      document.createElement("img");

    img.src = "cards/" + card;

    img.onclick = () => {

      // 내 턴 아닐 때 차단
      if (state.turn !== myId) return;

      socket.emit("playCard", {
        roomId: state.roomId,
        card
      });
    };

    el.appendChild(img);
  });
}

// =========================
// Captured
// =========================
function renderCaptured() {

  const el =
    document.getElementById("captured");

  el.innerHTML = "";

  const captured =
    state.captured?.[myId] || [];

  captured.forEach(card => {

    const img =
      document.createElement("img");

    img.src = "cards/" + card;

    img.style.width = "35px";

    el.appendChild(img);
  });
}
