const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUITS = ['♠','♥','♦','♣'];

function buildDeck() {
  const deck = [];
  for (const rank of RANKS)
    for (const suit of SUITS)
      deck.push({ rank, suit, id: `${rank}${suit}` });
  return shuffle(deck);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createGame(players) {
  const deck = buildDeck(); // 52 cards
  const hands = {};
  let idx = 0;
  for (const p of players) {
    hands[p.id] = deck.slice(idx, idx + 4);
    idx += 4;
  }
  const table = deck.slice(idx, idx + 4);
  idx += 4;
  const drawPile = deck.slice(idx); // 32 remaining

  return {
    players,
    hands,
    table,
    drawPile,
    discard: [],
    phase: 'playing',
    signaledBy: null,
    signalType: null,
    winner: null,
  };
}

function refreshTable(game) {
  game.discard.push(...game.table);
  if (game.drawPile.length < 4) {
    game.drawPile.push(...shuffle(game.discard));
    game.discard = [];
  }
  game.table = game.drawPile.splice(0, 4);
}

function hasQuad(hand) {
  const counts = {};
  for (const c of hand) counts[c.rank] = (counts[c.rank] || 0) + 1;
  return Object.values(counts).some(v => v === 4);
}

function doSwap(game, playerId, handCardId, tableCardId) {
  if (game.phase !== 'playing') return { ok: false, reason: 'Not in playing phase' };
  const hand = game.hands[playerId];
  const hi = hand.findIndex(c => c.id === handCardId);
  const ti = game.table.findIndex(c => c.id === tableCardId);
  if (hi === -1) return { ok: false, reason: 'Card not in hand' };
  if (ti === -1) return { ok: false, reason: 'Card not on table' };
  [hand[hi], game.table[ti]] = [game.table[ti], hand[hi]];
  return { ok: true };
}

function getTeammate(game, playerId) {
  const me = game.players.find(p => p.id === playerId);
  return game.players.find(p => p.id !== playerId && p.team === me.team);
}

module.exports = { createGame, doSwap, hasQuad, refreshTable, getTeammate };
