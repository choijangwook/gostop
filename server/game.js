// server/game.js

const MONTHS = 12;

function createDeck() {
  const deck = [];
  for (let m = 1; m <= MONTHS; m++) {
    deck.push({ month: m, type: "bright" });
    deck.push({ month: m, type: "animal" });
    deck.push({ month: m, type: "ribbon" });
    deck.push({ month: m, type: "junk" });
  }
  return shuffle(deck);
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function dealCards(deck) {
  return {
    player: deck.splice(0, 10),
    opponent: deck.splice(0, 10),
    table: deck.splice(0, 8),
    draw: deck
  };
}

function matchCard(card, table) {
  return table.filter(t => t.month === card.month);
}

function calculateScore(cards) {
  const bright = cards.filter(c => c.type === "bright").length;
  const ribbon = cards.filter(c => c.type === "ribbon").length;
  const junk = cards.filter(c => c.type === "junk").length;

  let score = 0;
  if (bright >= 3) score += bright;
  if (ribbon >= 5) score += ribbon - 4;
  if (junk >= 10) score += junk - 9;

  return score;
}

module.exports = {
  createDeck,
  dealCards,
  matchCard,
  calculateScore
};
