const socket = io();

// ── State ─────────────────────────────────────────────────────────────────
let myId           = null;
let myTeam         = null;
let chosenTeam     = 1;
let chosenGender   = 'male';
let chosenSkin     = 'light';
let selectedHand   = null;
let selectedTable  = null;
let currentPhase   = 'playing';
let playerMap      = {};
let chosenSignal   = null;   // signal the team agreed on in lobby chat

const TEAM_ZONES = {
  1: { top: 'touch-head', middle: 'raise-eyebrow' },
  2: { top: 'wink',       middle: 'touch-nose'    },
};

// ── Screen ────────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Seat logic ─────────────────────────────────────────────────────────────
function seatOf(playerId, players) {
  const me = players.find(p => p.id === myId);
  if (!me) return 'top';
  if (playerId === myId) return 'bottom';
  const p = players.find(p => p.id === playerId);
  if (p.team === me.team) return 'top';
  const opps = players.filter(p => p.team !== me.team);
  return opps[0]?.id === playerId ? 'left' : 'right';
}

// ── CREATE SCREEN ──────────────────────────────────────────────────────────
function updatePreview() {
  const el = document.getElementById('create-preview');
  if (el) el.innerHTML = makeAvatarSVG(chosenGender, chosenTeam, chosenSkin, 'prev');
}

window.addEventListener('DOMContentLoaded', () => {
  updatePreview();
});

document.querySelectorAll('.char-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    chosenGender = btn.dataset.gender;
    document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (myId) socket.emit('update_appearance', { gender: chosenGender });
    updatePreview();
  });
});

document.querySelectorAll('.skin-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    chosenSkin = btn.dataset.skin;
    document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (myId) socket.emit('update_appearance', { skin: chosenSkin });
    updatePreview();
  });
});

document.querySelectorAll('.team-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    chosenTeam = Number(btn.dataset.team);
    document.querySelectorAll('.team-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (myId) socket.emit('change_team', { team: chosenTeam });
    updatePreview();
  });
});

document.getElementById('btn-join').addEventListener('click', () => {
  const name = document.getElementById('input-name').value.trim();
  if (!name) { document.getElementById('input-name').focus(); return; }
  try {
    localStorage.setItem('cs:identity', JSON.stringify({
      name, team: chosenTeam, gender: chosenGender, skin: chosenSkin,
    }));
  } catch (_) {}
  socket.emit('join_lobby', { name, team: chosenTeam, gender: chosenGender, skin: chosenSkin });
  showScreen('screen-lobby');
});

// If a player reloads mid-game (or their phone briefly drops Safari), try to
// reclaim their seat by name + team. Server holds the seat for 20s.
socket.on('connect', () => {
  let identity = null;
  try { identity = JSON.parse(localStorage.getItem('cs:identity') || 'null'); } catch (_) {}
  if (identity && identity.name && identity.team) {
    socket.emit('reclaim_seat', { name: identity.name, team: identity.team });
  }
});
document.getElementById('input-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-join').click();
});

// ── LOBBY ──────────────────────────────────────────────────────────────────
socket.on('lobby_update', (players) => {
  // ── Update team slot indicators on the CREATE screen (visible before joining) ──
  for (const t of [1, 2]) {
    const count = players.filter(p => p.team === t).length;
    const el = document.getElementById(`team-slots-${t}`);
    if (!el) continue;
    const free = 2 - count;
    if (free === 0) {
      el.textContent = '2/2 · full';
      el.className = 'team-slots slots-full';
    } else if (free === 1) {
      el.textContent = '1/2 · needs 1 more';
      el.className = 'team-slots slots-one';
    } else {
      el.textContent = '0/2 · 2 spots free';
      el.className = 'team-slots slots-open';
    }
    // Disable the button if full (unless that's the team the user already chose)
    const btn = document.querySelector(`.team-btn[data-team="${t}"]`);
    if (btn) {
      const isFull = free === 0;
      btn.disabled = isFull;
      btn.style.opacity = isFull ? '0.45' : '1';
      // If chosen team just got full, auto-switch to the other
      if (isFull && chosenTeam === t) {
        const other = t === 1 ? 2 : 1;
        chosenTeam = other;
        document.querySelectorAll('.team-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.team-btn[data-team="${other}"]`)?.classList.add('active');
        updatePreview();
      }
    }
  }

  const me = players.find(p => p.id === myId);

  // Build seat map
  const seats = { top: null, bottom: null, left: null, right: null };
  for (const p of players) {
    if (!me) {
      const fallback = ['bottom','top','left','right'];
      seats[fallback[players.indexOf(p)]] = p;
    } else {
      seats[seatOf(p.id, players)] = p;
    }
  }

  const SIGNAL_NAMES = {
    1: ['Touch Head', 'Raise Eyebrow'],
    2: ['Wink',       'Touch Nose'],
  };

  for (const [pos, p] of Object.entries(seats)) {
    const el = document.getElementById(`lb-${pos}`);
    if (!el) continue;
    const sig = p ? `${p.id}|${p.gender}|${p.team}|${p.skin}` : 'empty';
    if (el.dataset.sig === sig) continue;
    el.dataset.sig = sig;
    el.innerHTML = '';
    if (p) {
      const wrap = document.createElement('div');
      wrap.className = 'av-wrap';
      wrap.innerHTML = makeAvatarSVG(p.gender, p.team, p.skin, `lb${pos}`);
      el.appendChild(wrap);
      const nm = document.createElement('div');
      nm.className = `pname t${p.team}`;
      nm.textContent = p.name + (p.id === myId ? ' (you)' : '');
      el.appendChild(nm);
      // Signal tags — only on YOUR own seat (bottom), private to you
      if (pos === 'bottom') {
        const sigs = SIGNAL_NAMES[p.team];
        if (sigs) {
          const sigRow = document.createElement('div');
          sigRow.className = `lb-signals lb-team${p.team}`;
          sigRow.innerHTML = sigs.map(s => `<span class="lb-sig">${s}</span>`).join('');
          el.appendChild(sigRow);
        }
      }
    } else {
      const empty = document.createElement('div');
      empty.className = 'lb-empty';
      el.appendChild(empty);
    }
  }

  const t1 = players.filter(p => p.team === 1).length;
  const t2 = players.filter(p => p.team === 2).length;
  const inLobby = !!me;
  const needed = 4 - players.length;

  document.getElementById('lobby-status').textContent =
    needed > 0 ? `Waiting for ${needed} more player${needed > 1 ? 's' : ''}…` : 'All ready!';

  // Start button visibility is now driven by `lobby_countdown` (lobby_ready flag).
  // We only hide it here if not 2v2; the ready handler shows it when chat time ends.
  const startBtn = document.getElementById('btn-start');
  if (!(inLobby && t1 === 2 && t2 === 2)) {
    startBtn.style.display = 'none';
    startBtn.classList.remove('btn-ready-reveal');
  }
  document.getElementById('btn-test').style.display =
    inLobby ? 'block' : 'none';

  // Color chat title by team
  if (me) {
    const title = document.getElementById('chat-title');
    title.textContent = `Team ${me.team} Chat`;
    title.style.color = me.team === 1 ? 'var(--t1)' : 'var(--t2)';

    // Populate signal vote buttons (once, based on team)
    const voteWrap = document.getElementById('signal-vote');
    const voteBtns = document.getElementById('signal-vote-btns');
    if (voteWrap && voteBtns && !voteBtns.dataset.built) {
      voteBtns.dataset.built = '1';
      voteWrap.style.display = 'block';
      const zones = TEAM_ZONES[me.team];
      for (const key of ['top', 'middle']) {
        const gesture = zones[key];
        const label   = gesture.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const btn = document.createElement('button');
        btn.className   = 'btn-vote';
        btn.textContent = label;
        btn.addEventListener('click', () => {
          socket.emit('signal_vote', { signal: gesture });
          document.querySelectorAll('.btn-vote').forEach(b => b.classList.remove('voted'));
          btn.classList.add('voted');
          chosenSignal = gesture;  // remember for in-game
          // Preview the gesture on your own lobby avatar
          const svg = document.querySelector('#lb-bottom .av-wrap svg');
          if (svg) playGestureAnim(svg, gesture);
        });
        voteBtns.appendChild(btn);
      }
    }
  }
});

document.getElementById('btn-start').addEventListener('click', () => socket.emit('start_game'));
document.getElementById('btn-test').addEventListener('click',  () => socket.emit('start_test'));

// ── TEAM CHAT ──────────────────────────────────────────────────────────────
document.getElementById('btn-chat-send').addEventListener('click', sendChat);
document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChat();
});

function sendChat() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;
  socket.emit('team_message', { text });
  input.value = '';
}

socket.on('team_message', ({ from, text, team, isVote }) => {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = `chat-msg team${team}${isVote ? ' vote' : ''}`;
  div.innerHTML = `<span class="cm-from">${esc(from)}:</span><span class="cm-text">${esc(text)}</span>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
});

// ── WiFi share + QR code ───────────────────────────────────────────────────
fetch('/api/ip')
  .then(r => r.json())
  .then(({ ip, port }) => {
    const url = `http://${ip}:${port}`;
    const urlEl = document.getElementById('wifi-url');
    if (urlEl) urlEl.textContent = url;

    const copyBtn = document.getElementById('btn-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(url).then(() => {
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 2000);
        });
      });
    }

    // QR code
    const qrEl = document.getElementById('qr-code');
    if (qrEl && window.QRCode) {
      new QRCode(qrEl, {
        text: url, width: 120, height: 120,
        colorDark: '#e2e6f8', colorLight: '#14172a',
      });
    }
  })
  .catch(() => {});

socket.on('game_started', () => {
  showScreen('screen-game');
  socket.emit('get_state');
});

// ── Lobby chat countdown ───────────────────────────────────────────────────
socket.on('lobby_countdown', ({ seconds, ready }) => {
  const statusEl = document.getElementById('lobby-status');
  const startBtn = document.getElementById('btn-start');
  if (ready) {
    if (statusEl) statusEl.textContent = "Ready to play!";
    startBtn.style.display = 'block';
    startBtn.classList.add('btn-ready-reveal');
  } else if (seconds > 0) {
    if (statusEl) statusEl.textContent = `Everyone's here! Chat time — game starts in ${seconds}s`;
    startBtn.style.display = 'none';
    startBtn.classList.remove('btn-ready-reveal');
  } else {
    startBtn.classList.remove('btn-ready-reveal');
  }
});

// ── Disconnect / reconnect notifications ───────────────────────────────────
socket.on('player_dropped', ({ name, graceSeconds }) => {
  const err = document.getElementById('game-error');
  if (err) {
    err.textContent = `${name} dropped — waiting ${graceSeconds}s for them to come back…`;
    err.style.color = 'var(--gold)';
  }
});
socket.on('player_reclaimed', ({ name }) => {
  const err = document.getElementById('game-error');
  if (err) {
    err.textContent = `${name} reconnected.`;
    setTimeout(() => { if (err.textContent.includes('reconnected')) err.textContent = ''; }, 2500);
  }
});

// ── GAME ───────────────────────────────────────────────────────────────────
socket.on('state_update', (state) => {
  myId         = state.myId;
  currentPhase = state.phase;
  playerMap    = {};
  for (const p of state.players) playerMap[p.id] = p;

  const me = state.players.find(p => p.id === myId);
  if (me) myTeam = me.team;

  // If we just reclaimed a seat after a reload, jump back to the game screen
  const activeScreen = document.querySelector('.screen.active')?.id;
  if (activeScreen !== 'screen-game' && state.phase !== 'ended') {
    showScreen('screen-game');
  }

  renderAvatars(state.players);
  renderTable(state.table);
  renderHand(state.myHand);
  renderActions(state);
  updateSignalButtons();

  if (state.phase === 'ended' && state.winner) {
    // Game is over — clear the reconnect identity so a future reload doesn't
    // try to reclaim a non-existent seat.
    try { localStorage.removeItem('cs:identity'); } catch (_) {}
    const won    = state.winner.team === myTeam;
    const cheat  = state.winner.cheat === true;

    if (cheat) {
      document.getElementById('end-emoji').textContent = won ? '🎉' : '🚨';
      document.getElementById('end-title').textContent = won ? 'You Win!' : 'Caught Cheating!';
    } else {
      document.getElementById('end-emoji').textContent = won ? '🏆' : '💔';
      document.getElementById('end-title').textContent = won ? 'You Win!' : 'You Lose!';
    }
    document.getElementById('end-reason').textContent = state.winner.reason;

    // Show the hand to everyone (winning quad, or exposed cheat hand)
    const handEl = document.getElementById('end-winning-hand');
    handEl.innerHTML = '';
    if (state.winner.winningHand?.length) {
      const label = document.createElement('p');
      label.className = 'end-hand-label';
      label.textContent = cheat
        ? `Exposed hand — no 4-of-a-kind:`
        : `Team ${state.winner.team}'s winning hand:`;
      handEl.appendChild(label);
      const row = document.createElement('div');
      row.className = 'end-hand-row';
      state.winner.winningHand.forEach(c => row.appendChild(cardEl(c)));
      handEl.appendChild(row);
    }
    setTimeout(() => showScreen('screen-end'), 700);
  }
});

socket.on('table_countdown', (n) => {
  const el = document.getElementById('countdown');
  if (!el) return;
  el.textContent = n;
  el.className = 'countdown' + (n <= 2 ? ' urgent' : '');
});

// ── Rendering ──────────────────────────────────────────────────────────────
function renderAvatars(players) {
  for (const p of players) {
    const seat  = seatOf(p.id, players);
    const avEl  = document.getElementById(`av-${seat}`);
    const nmEl  = document.getElementById(`nm-${seat}`);
    if (!avEl || !nmEl) continue;

    const sig = `${p.id}|${p.gender}|${p.team}|${p.skin}`;
    if (avEl.dataset.sig !== sig) {
      avEl.dataset.sig = sig;
      avEl.innerHTML = makeAvatarSVG(p.gender, p.team, p.skin, `s${seat}`);
    }

    nmEl.textContent = p.id === myId ? `${p.name} (you)` : p.name;
    nmEl.className   = `pname t${p.team}${p.id === myId ? ' you-tag' : ''}`;
  }
}

function renderTable(cards) {
  const row = document.getElementById('table-cards');
  row.innerHTML = '';
  for (const c of cards) {
    const el = cardEl(c);
    el.addEventListener('click', () => onTableClick(c.id));
    row.appendChild(el);
  }
}

function renderHand(cards) {
  const row = document.getElementById('hand-cards');
  row.innerHTML = '';
  for (const c of cards) {
    const el = cardEl(c);
    el.addEventListener('click', () => onHandClick(c.id));
    row.appendChild(el);
  }
}

function renderActions(state) {
  const cantBtn  = document.getElementById('btn-cant-stop');
  const cantHint = document.getElementById('cant-stop-hint');
  const stopBtn  = document.getElementById('btn-stop');

  // Can't Stop: always visible, lights up only when teammate has signaled
  if (state.canCantStop) {
    cantBtn.classList.add('active');
    if (cantHint) cantHint.style.display = 'block';
  } else {
    cantBtn.classList.remove('active');
    if (cantHint) cantHint.style.display = 'none';
  }

  // Stop: always visible to opponents
  const signaler = state.players?.find(p => p.id === state.signaledBy);
  const amOpponent = signaler ? signaler.team !== myTeam : true;
  stopBtn.style.display = amOpponent ? 'block' : 'none';
}

// ── Card interaction ────────────────────────────────────────────────────────
function onHandClick(id) {
  if (currentPhase !== 'playing') return;
  selectedHand = selectedHand === id ? null : id;
  trySwap(); updateSelUI();
}
function onTableClick(id) {
  if (currentPhase !== 'playing') return;
  selectedTable = selectedTable === id ? null : id;
  trySwap(); updateSelUI();
}
function trySwap() {
  if (selectedHand && selectedTable) {
    socket.emit('swap', { handCardId: selectedHand, tableCardId: selectedTable });
    selectedHand = selectedTable = null;
  }
}
function updateSelUI() {
  document.querySelectorAll('.card').forEach(el => {
    el.classList.toggle('selected',
      el.dataset.id === selectedHand || el.dataset.id === selectedTable);
  });
}

// ── Signal buttons (YOUR gestures) ─────────────────────────────────────────
document.getElementById('btn-signal-1').addEventListener('click', () => {
  if (!myTeam || currentPhase !== 'playing') return;
  const gesture = TEAM_ZONES[myTeam]?.top;
  if (gesture) socket.emit('gesture', { gestureType: gesture });
});
document.getElementById('btn-signal-2').addEventListener('click', () => {
  if (!myTeam || currentPhase !== 'playing') return;
  const gesture = TEAM_ZONES[myTeam]?.middle;
  if (gesture) socket.emit('gesture', { gestureType: gesture });
});

function updateSignalButtons() {
  const zones = TEAM_ZONES[myTeam];
  if (!zones) return;
  const fmt = s => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const btn1 = document.getElementById('btn-signal-1');
  const btn2 = document.getElementById('btn-signal-2');
  btn1.textContent = fmt(zones.top);
  btn2.textContent = fmt(zones.middle);
  // If team agreed on a signal in chat, disable the other one
  if (chosenSignal) {
    const disable1 = zones.top    !== chosenSignal;
    const disable2 = zones.middle !== chosenSignal;
    btn1.disabled = disable1;
    btn2.disabled = disable2;
    btn1.style.opacity = disable1 ? '0.35' : '1';
    btn2.style.opacity = disable2 ? '0.35' : '1';
  }
}

// ── Gesture animation (broadcast — everyone sees it) ───────────────────────

// Keyframes: [timeFraction 0-1, tx, ty] in SVG user units
const GESTURE_KEYFRAMES = {
  'touch-head':    {
    hand: [[0,0,0],[0.14,-10,-38],[0.30,-26,-84],[0.70,-26,-84],[0.86,-10,-38],[1,0,0]],
    brow: [],
    duration: 1200,
  },
  'raise-eyebrow': {
    hand: [[0,0,0],[0.14,-8,-28],[0.30,-25,-62],[0.70,-25,-62],[0.86,-8,-28],[1,0,0]],
    brow: [[0,0,0],[0.25,1,-6],[0.40,1,-7],[0.60,1,-7],[0.75,1,-6],[1,0,0]],
    duration: 1200,
  },
  'touch-nose':    {
    hand: [[0,0,0],[0.14,-12,-22],[0.30,-32,-53],[0.70,-32,-53],[0.86,-12,-22],[1,0,0]],
    brow: [],
    duration: 1200,
  },
  'wink':          {
    // SVG fallback only — drops right eyelid briefly via brow channel
    hand: [],
    brow: [[0,0,0],[0.20,0,2],[0.40,0,3.2],[0.60,0,3.2],[0.80,0,2],[1,0,0]],
    duration: 900,
  },
};

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function interpKeyframes(keyframes, t) {
  for (let i = 1; i < keyframes.length; i++) {
    const [t0, x0, y0] = keyframes[i - 1];
    const [t1, x1, y1] = keyframes[i];
    if (t <= t1) {
      const frac = (t1 === t0) ? 0 : (t - t0) / (t1 - t0);
      const e = easeInOut(Math.max(0, Math.min(1, frac)));
      return [x0 + (x1 - x0) * e, y0 + (y1 - y0) * e];
    }
  }
  const last = keyframes[keyframes.length - 1];
  return [last[1], last[2]];
}

function playGestureAnim(svg, gestureType) {
  const spec = GESTURE_KEYFRAMES[gestureType];
  if (!spec) return;

  const hand = svg.querySelector('.hand-signal');
  const browR = svg.querySelector('.brow-r');
  const browL = svg.querySelector('.brow-l');

  // Ensure hand renders on top
  if (hand) svg.appendChild(hand);

  const startTime = performance.now();

  function frame(now) {
    const t = Math.min((now - startTime) / spec.duration, 1);

    if (hand && spec.hand.length) {
      const [tx, ty] = interpKeyframes(spec.hand, t);
      hand.setAttribute('transform', `translate(${tx.toFixed(2)},${ty.toFixed(2)})`);
    }
    if (browR && spec.brow.length) {
      const [tx, ty] = interpKeyframes(spec.brow, t);
      browR.setAttribute('transform', `translate(${tx.toFixed(2)},${ty.toFixed(2)})`);
      if (browL) browL.setAttribute('transform', `translate(${(tx * 0.6).toFixed(2)},${ty.toFixed(2)})`);
    }

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      if (hand)  hand.removeAttribute('transform');
      if (browR) browR.removeAttribute('transform');
      if (browL) browL.removeAttribute('transform');
    }
  }

  requestAnimationFrame(frame);
}

socket.on('gesture_anim', ({ playerId, gestureType }) => {
  const players = Object.values(playerMap);
  const seat    = seatOf(playerId, players);
  const avEl    = document.getElementById(`av-${seat}`);
  if (!avEl) return;
  const svg = avEl.querySelector('svg');
  if (svg) playGestureAnim(svg, gestureType);

  // Show floating label above avatar (visible to ALL players)
  const slot = avEl.closest('.pslot') || avEl.parentElement;
  const existing = slot.querySelector('.gesture-label');
  if (existing) existing.remove();
  const label = document.createElement('div');
  label.className = 'gesture-label';
  label.textContent = gestureType.replace(/-/g, ' ');
  slot.appendChild(label);
  setTimeout(() => label.remove(), 2200);
});

// ── Private teammate notification ───────────────────────────────────────────
socket.on('teammate_signaled', () => {
  // Subtle green border flash on the game screen
  const gameScreen = document.getElementById('screen-game');
  gameScreen.classList.add('teammate-flash');
  setTimeout(() => gameScreen.classList.remove('teammate-flash'), 1600);

  // Also show Can't Stop button (state_update will follow with canCantStop:true)
});

// ── Action buttons ─────────────────────────────────────────────────────────
document.getElementById('btn-cant-stop').addEventListener('click', () => {
  socket.emit('cant_stop');
});
document.getElementById('btn-stop').addEventListener('click',      () => socket.emit('stop'));
document.getElementById('btn-play-again').addEventListener('click', () => {
  socket.emit('play_again');
  showScreen('screen-game');
});
document.getElementById('btn-new-game').addEventListener('click', () => {
  location.reload();   // full reset — back to character create screen
});

// ── Errors ──────────────────────────────────────────────────────────────────
socket.on('error_msg', (msg) => {
  const inGame = document.getElementById('screen-game').classList.contains('active');
  const el = document.getElementById(inGame ? 'game-error' : 'lobby-error');
  el.textContent = msg;
  setTimeout(() => el.textContent = '', 3500);
});

// ── Helpers ─────────────────────────────────────────────────────────────────
const RED_SUITS = new Set(['♥','♦']);
function cardEl(card) {
  const el = document.createElement('div');
  el.className = `card ${RED_SUITS.has(card.suit) ? 'red' : 'black'}`;
  el.dataset.id = card.id;
  el.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span>`;
  return el;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g,
    c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
socket.on('connect', () => { myId = socket.id; });
