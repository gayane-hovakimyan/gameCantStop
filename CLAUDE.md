# Can't Stop — Project Memory

## What this is
A real-time 2v2 secret-signal card game, playable in a browser over local WiFi.  
Stack: **Node.js + Express + Socket.io** (server) · **Vanilla JS + SVG** (client).

## How to run
```bash
node server.js        # starts on port 3000
# or via Claude Code preview: uses .claude/launch.json → name "cant-stop"
```
Kill stale process first if port is busy: `lsof -ti:3000 | xargs kill -9`

## File map
| File | Purpose |
|------|---------|
| `server.js` | Express server, Socket.io events, game phase logic |
| `game.js` | Pure game logic: deck, deal, swap, hasQuad, refreshTable |
| `public/index.html` | All 4 screens (create · lobby · game · end) |
| `public/game.js` | Client socket handlers, render functions, UI |
| `public/avatar.js` | SVG avatar builder — `makeAvatarSVG(gender,team,skin,uid)` |
| `public/style.css` | All styles + CSS keyframe gesture animations |

## Game rules (brief)
- 4 players, 2 teams (Team 1 blue · Team 2 red)
- Each player holds 4 cards; 4 cards on the table; free-for-all swapping
- Table cards refresh every 5 seconds
- Win: get 4-of-a-kind → secretly signal teammate → teammate says **"Can't Stop!"**
- Opponents can say **"Stop!"** if they catch the real signal

## Signals per team
| Team | Signal 1 | Signal 2 |
|------|----------|----------|
| Team 1 | Touch Head | Raise Eyebrow |
| Team 2 | Touch Nose | Play with Hair |

Signals are always visible to everyone (bluffing allowed).  
The actual "signaling" (phase change) only happens server-side when `hasQuad()` is true.

## Avatar design notes
- ViewBox: `0 0 80 110`  
- Table surface drawn at y=84–88  
- `.hand-signal` SVG group = right arm+hand; animated via CSS `transform: translate()`  
- `.brow-r` = right eyebrow; animated for raise-eyebrow  
- `transform-box: fill-box` required on both for animations to work  
- Gradient IDs must be unique — always pass a unique `uid` to `makeAvatarSVG()`  
- Female: dark curly hair crown + hanging side locks; white blouse; team-color belt  
- Male: short hair cap; team-color shirt  

## Key socket events
- `gesture` → server broadcasts `gesture_anim` to all; privately sends `teammate_signaled` if quad
- `cant_stop` → teammate confirms signal → team wins
- `stop` → opponent catches signal → opponents win
- Phase `'signaled'` is **never** sent to clients — always shown as `'playing'`

## Known quirks
- `@extend` CSS syntax is SCSS only — use duplicate rules instead  
- Gradient `id="sg${uid}"` collides if uid is the same on multiple avatars — always unique  
- Test mode (`start_test`) fills with 3 bots: Alex (T1), Sara (T2), Mike (T2)
