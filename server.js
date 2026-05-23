const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { createGame, doSwap, hasQuad, refreshTable, getTeammate } = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Return local network IP so the lobby can show a shareable link
app.get('/api/ip', (req, res) => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let localIp = 'localhost';
  for (const ifaces of Object.values(nets))
    for (const n of ifaces)
      if (n.family === 'IPv4' && !n.internal) { localIp = n.address; break; }
  res.json({ ip: localIp, port: PORT });
});

const TIMER_SECONDS = 10;

const TEAM_GESTURES = {
  1: ['touch-head', 'raise-eyebrow'],
  2: ['wink',       'touch-nose'],
};

let lobby = [];
let game  = null;
let tableTimer   = null;
let countdown    = TIMER_SECONDS;

const LOBBY_CHAT_SECONDS = 10;
let lobbyTimer    = null;
let lobbyCountdown = 0;
let lobbyReady    = false;

// ── Helpers ───────────────────────────────────────────────────────────────
function broadcastLobby() {
  io.emit('lobby_update', lobby);
  manageLobbyCountdown();
}

function isLobbyBalanced() {
  if (lobby.length !== 4) return false;
  const t1 = lobby.filter(p => p.team === 1).length;
  const t2 = lobby.filter(p => p.team === 2).length;
  return t1 === 2 && t2 === 2;
}

function manageLobbyCountdown() {
  if (game && game.phase !== 'ended') return; // game in progress
  if (!isLobbyBalanced()) {
    if (lobbyTimer || lobbyReady) {
      clearInterval(lobbyTimer);
      lobbyTimer = null;
      lobbyCountdown = 0;
      lobbyReady = false;
      io.emit('lobby_countdown', { seconds: 0, ready: false });
    }
    return;
  }
  // Already counting down or already ready — leave it alone
  if (lobbyTimer || lobbyReady) return;
  lobbyCountdown = LOBBY_CHAT_SECONDS;
  io.emit('lobby_countdown', { seconds: lobbyCountdown, ready: false });
  lobbyTimer = setInterval(() => {
    lobbyCountdown--;
    if (lobbyCountdown <= 0) {
      clearInterval(lobbyTimer);
      lobbyTimer = null;
      lobbyReady = true;
      io.emit('lobby_countdown', { seconds: 0, ready: true });
    } else {
      io.emit('lobby_countdown', { seconds: lobbyCountdown, ready: false });
    }
  }, 1000);
}

function startTableTimer() {
  countdown = TIMER_SECONDS;
  clearInterval(tableTimer);
  tableTimer = setInterval(() => {
    if (!game || game.phase === 'ended') return;
    countdown--;
    io.emit('table_countdown', countdown);
    if (countdown <= 0) {
      refreshTable(game);
      countdown = TIMER_SECONDS;
      io.emit('table_countdown', countdown);
      fanOutState();
    }
  }, 1000);
}

function stopTableTimer() { clearInterval(tableTimer); tableTimer = null; }

// Public state — never leaks 'signaled' phase to all; each player gets only their slice
function fanOutState() {
  if (!game) return;
  for (const p of game.players) {
    // Only the TEAMMATE (not the signaler) gets canCantStop = true
    const isSignaledTeammate =
      game.phase === 'signaled' &&
      game.signaledBy &&
      p.id !== game.signaledBy &&
      game.players.find(q => q.id === p.id)?.team ===
      game.players.find(q => q.id === game.signaledBy)?.team;

    io.to(p.id).emit('state_update', {
      // Hide internal 'signaled' phase — opponents see it as 'playing'
      phase:   game.phase === 'ended' ? 'ended' : 'playing',
      table:   game.table,
      winner:  game.winner,
      players: game.players,
      countdown,
      myHand:      game.hands[p.id] || [],
      myId:        p.id,
      canCantStop: isSignaledTeammate,
    });
  }
}

function launchGame(players) {
  // Game is starting — cancel any pending lobby countdown
  clearInterval(lobbyTimer);
  lobbyTimer = null;
  lobbyReady = false;
  lobbyCountdown = 0;
  game = createGame(players);
  startTableTimer();
  fanOutState();
}

// ── Socket events ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('connected:', socket.id);
  // Immediately send current lobby so the create screen shows live team slots
  socket.emit('lobby_update', lobby);
  socket.emit('lobby_countdown', { seconds: lobbyCountdown, ready: lobbyReady });

  // ── Lobby ────────────────────────────────────────────────────────────────
  socket.on('join_lobby', ({ name, team, gender, skin }) => {
    if (lobby.length >= 4) { socket.emit('error_msg', 'Room is full (4 max)'); return; }
    if (![1,2].includes(Number(team))) { socket.emit('error_msg', 'Invalid team'); return; }
    lobby = lobby.filter(p => p.id !== socket.id);
    lobby.push({
      id:     socket.id,
      name:   (name || '').trim().slice(0, 16) || 'Player',
      team:   Number(team),
      gender: gender === 'female' ? 'female' : 'male',
      skin:   ['light','medium','dark'].includes(skin) ? skin : 'light',
    });
    broadcastLobby();
  });

  socket.on('update_appearance', ({ gender, skin }) => {
    const p = lobby.find(p => p.id === socket.id);
    if (!p) return;
    if (gender) p.gender = gender;
    if (skin)   p.skin   = skin;
    broadcastLobby();
  });

  socket.on('change_team', ({ team }) => {
    const p = lobby.find(p => p.id === socket.id);
    if (p) { p.team = Number(team); broadcastLobby(); }
  });

  // Team chat — private per team
  socket.on('team_message', ({ text }) => {
    const me = lobby.find(p => p.id === socket.id);
    if (!me || !text?.trim()) return;
    const msg = { from: me.name, text: text.trim().slice(0, 200), team: me.team };
    for (const p of lobby.filter(q => q.team === me.team)) {
      io.to(p.id).emit('team_message', msg);
    }
  });

  // Signal vote — teammate sees which signal you picked
  socket.on('signal_vote', ({ signal }) => {
    const me = lobby.find(p => p.id === socket.id);
    if (!me || !signal) return;
    const label = signal.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const msg = { from: me.name, text: `wants to use "${label}" as the signal 👆`, team: me.team, isVote: true };
    for (const p of lobby.filter(q => q.team === me.team)) {
      io.to(p.id).emit('team_message', msg);
    }
  });

  socket.on('start_game', () => {
    const t1 = lobby.filter(p => p.team === 1);
    const t2 = lobby.filter(p => p.team === 2);
    if (t1.length !== 2 || t2.length !== 2) {
      socket.emit('error_msg', 'Need exactly 2 players on each team');
      return;
    }
    if (!lobbyReady) {
      socket.emit('error_msg', 'Please wait — chat time is still running');
      return;
    }
    clearInterval(lobbyTimer);
    lobbyTimer = null;
    lobbyReady = false;
    launchGame(lobby);
    io.emit('game_started');
  });

  socket.on('start_test', () => {
    const me = lobby.find(p => p.id === socket.id);
    if (!me) return;
    // Keep the player's chosen team — fill the other 3 seats with bots
    const bots = me.team === 1
      ? [
          { id: 'bot1', name: 'Alex', team: 1, gender: 'male',   skin: 'medium' },
          { id: 'bot2', name: 'Sara', team: 2, gender: 'female', skin: 'light'  },
          { id: 'bot3', name: 'Mike', team: 2, gender: 'male',   skin: 'dark'   },
        ]
      : [
          { id: 'bot1', name: 'Tom',  team: 1, gender: 'male',   skin: 'medium' },
          { id: 'bot2', name: 'Lisa', team: 1, gender: 'female', skin: 'light'  },
          { id: 'bot3', name: 'Alex', team: 2, gender: 'male',   skin: 'dark'   },
        ];
    launchGame([me, ...bots]);
    // Give the human player 4 Queens so they can test the full win flow
    game.hands[socket.id] = [
      { rank: 'Q', suit: '♠', id: 'Q♠' },
      { rank: 'Q', suit: '♥', id: 'Q♥' },
      { rank: 'Q', suit: '♦', id: 'Q♦' },
      { rank: 'Q', suit: '♣', id: 'Q♣' },
    ];
    socket.emit('game_started');
    // Send initial state directly to this socket
    socket.emit('state_update', {
      phase: 'playing', table: game.table, winner: null,
      players: game.players, countdown,
      myHand: game.hands[socket.id] || [],
      myId: socket.id, canCantStop: false,
    });
  });

  socket.on('get_state', () => {
    if (!game) return;
    const p = game.players.find(p => p.id === socket.id);
    if (!p) return;
    const isSignaledTeammate =
      game.phase === 'signaled' && game.signaledBy &&
      socket.id !== game.signaledBy &&
      p.team === game.players.find(q => q.id === game.signaledBy)?.team;
    socket.emit('state_update', {
      phase: game.phase === 'ended' ? 'ended' : 'playing',
      table: game.table, winner: game.winner,
      players: game.players, countdown,
      myHand: game.hands[socket.id] || [],
      myId: socket.id, canCantStop: isSignaledTeammate,
    });
    socket.emit('table_countdown', countdown);
  });

  // ── Game actions ──────────────────────────────────────────────────────────
  socket.on('swap', ({ handCardId, tableCardId }) => {
    if (!game || game.phase !== 'playing') return;
    const result = doSwap(game, socket.id, handCardId, tableCardId);
    if (!result.ok) { socket.emit('error_msg', result.reason); return; }
    fanOutState();
  });

  // Gesture: triggered by tapping avatar zones. ALWAYS available (can bluff).
  // If player has 4-of-a-kind → silently enters signaled phase, privately notifies teammate.
  socket.on('gesture', ({ gestureType }) => {
    if (!game || game.phase === 'ended') return;
    const me = game.players.find(p => p.id === socket.id);
    if (!me) return;
    const valid = TEAM_GESTURES[me.team];
    if (!valid?.includes(gestureType)) return;

    // Broadcast gesture animation to ALL (visible like a real gesture at the table)
    io.emit('gesture_anim', { playerId: socket.id, gestureType });

    // Only enter signaled if we have 4-of-a-kind and aren't already in that state
    if (game.phase === 'playing' && hasQuad(game.hands[socket.id] || [])) {
      game.phase     = 'signaled';
      game.signaledBy = socket.id;
      game.signalType = gestureType;

      // Privately tell only the teammate — opponents see nothing in UI
      const teammate = getTeammate(game, socket.id);
      if (teammate && !teammate.id.startsWith('bot')) {
        io.to(teammate.id).emit('teammate_signaled');
      }

      fanOutState(); // sends canCantStop:true to teammate
    }
  });

  socket.on('cant_stop', () => {
    if (!game || game.phase !== 'signaled') {
      socket.emit('error_msg', "No signal in progress");
      return;
    }
    const me       = game.players.find(p => p.id === socket.id);
    const signaler = game.players.find(p => p.id === game.signaledBy);
    // Only the TEAMMATE (not the signaler themselves) can claim the win
    if (!signaler || signaler.team !== me.team || signaler.id === me.id) {
      socket.emit('error_msg', "Only your teammate can say Can't Stop after your signal");
      return;
    }

    // ── Anti-cheat: re-verify the signaler STILL has 4-of-a-kind right now ──
    const signalerHand = game.hands[game.signaledBy] || [];
    const stillHasQuad = hasQuad(signalerHand);

    stopTableTimer();
    if (stillHasQuad) {
      game.phase  = 'ended';
      game.winner = {
        team:        me.team,
        reason:      `Team ${me.team} wins! "Can't Stop!"`,
        winningHand: signalerHand,
        cheat:       false,
      };
    } else {
      // Signaler swapped their quad away after signaling — CHEAT
      const otherTeam = me.team === 1 ? 2 : 1;
      game.phase  = 'ended';
      game.winner = {
        team:        otherTeam,
        reason:      `Team ${otherTeam} wins — Team ${me.team} had no 4-of-a-kind! 🚨`,
        winningHand: signalerHand,   // expose the real hand
        cheat:       true,
      };
    }
    fanOutState();
  });

  // Opponents call Stop when they think they spotted the real signal
  socket.on('stop', () => {
    if (!game || game.phase === 'ended') return;
    const me       = game.players.find(p => p.id === socket.id);
    const signaler = game.players.find(p => p.id === game.signaledBy);

    if (game.phase !== 'signaled') {
      return; // no active signal — silently ignore (could be a bluff)
    }
    if (!signaler || me.team === signaler.team) {
      return; // can't stop your own team — silently ignore
    }
    game.phase  = 'ended';
    game.winner = { team: me.team, reason: `Team ${me.team} wins — caught the signal!` };
    stopTableTimer();
    fanOutState();
  });

  socket.on('play_again', () => {
    if (!game || game.phase !== 'ended') return;
    const players = lobby.length === 4 ? lobby : game.players;
    launchGame(players);
    io.emit('game_started');
  });

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
    // Always drop them from the lobby — a fresh socket will re-join via 'join_lobby'
    lobby = lobby.filter(p => p.id !== socket.id);
    broadcastLobby();
    // In-game: don't end immediately. Give a 20s grace period so a flaky WiFi blip
    // (or a phone reload) doesn't kill the round.
    if (game && game.phase !== 'ended') {
      const playerInGame = game.players.find(p => p.id === socket.id);
      if (!playerInGame) return;
      playerInGame.disconnected = true;
      const name = playerInGame.name || 'Someone';
      io.emit('player_dropped', { playerId: socket.id, name, graceSeconds: 20 });
      if (playerInGame._graceTimer) clearTimeout(playerInGame._graceTimer);
      playerInGame._graceTimer = setTimeout(() => {
        if (!game || game.phase === 'ended') return;
        const stillGone = game.players.find(p => p.id === socket.id)?.disconnected;
        if (!stillGone) return;
        game.phase  = 'ended';
        game.winner = { team: null, reason: `${name} disconnected — game over` };
        stopTableTimer();
        fanOutState();
      }, 20_000);
    }
  });

  // A reconnecting client claims an in-game seat by name+team. Stable enough for
  // page reloads / brief network drops without needing localStorage IDs.
  socket.on('reclaim_seat', ({ name, team }) => {
    if (!game || game.phase === 'ended') return;
    const orphan = game.players.find(p =>
      p.disconnected && p.name === name && p.team === Number(team)
    );
    if (!orphan) return;
    const oldId = orphan.id;
    orphan.id = socket.id;
    orphan.disconnected = false;
    if (orphan._graceTimer) { clearTimeout(orphan._graceTimer); orphan._graceTimer = null; }
    // Move hand under the new socket id
    if (game.hands[oldId]) {
      game.hands[socket.id] = game.hands[oldId];
      delete game.hands[oldId];
    }
    if (game.signaledBy === oldId) game.signaledBy = socket.id;
    io.emit('player_reclaimed', { playerId: socket.id, name });
    fanOutState();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let localIp = 'localhost';
  for (const ifaces of Object.values(nets))
    for (const n of ifaces)
      if (n.family === 'IPv4' && !n.internal) { localIp = n.address; break; }
  console.log(`\nServer running!`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${localIp}:${PORT}  ← share with WiFi players\n`);
});
