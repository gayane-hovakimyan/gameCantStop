# Can't Stop 🎴

A fun little card game you play with friends in your browser — no app to install, just open a link.

It's a **2 vs 2** game of secret signals, bluffing, and quick reactions. Think poker face meets charades.

## How it works

Each player gets **4 cards**. There are **4 more cards on the table** that everyone can see. You swap cards from your hand with the table whenever you want — and so does everyone else. The table refreshes with new cards every few seconds.

**Your goal:** be the first team to get **4 of a kind** (like four Queens) in one player's hand.

But here's the twist — when you finally get 4 of a kind, you can't just shout it out. You have to **secretly signal your teammate**. Each team gets two secret gestures they agree on before the game starts:

| Team 1 (blue) | Team 2 (red) |
|---|---|
| Touch Head 🤚 | Wink 😉 |
| Raise Eyebrow 🤨 | Touch Nose 👃 |

Once your teammate spots your real signal, they hit **"Can't Stop!"** and your team wins.

The catch? **The other team can see your gestures too.** They're watching closely. If they think they caught your signal, they hit **"Stop!"** — and they win instead. So you'll want to bluff a little (fake gestures are allowed!) to throw them off.

Be careful though — if you hit Stop and there's no real signal happening, **your team loses**. So don't panic-click.

## How to play

1. Make sure all 4 players are on the **same WiFi network**.
2. One person starts the server (see below).
3. Everyone opens the link in their phone or laptop browser.
4. Pick a name, an avatar, and a team.
5. Chat with your teammate to agree on which signal you'll use.
6. Hit **Start Game** — and try to win!

There's also a **Test Mode (solo)** button if you just want to try the game alone with bots.

## Running it

You need [Node.js](https://nodejs.org/) installed.

```bash
git clone <this-repo>
cd gameProject
npm install
node server.js
```

Then open `http://localhost:3000` in your browser, or share the network link the server prints with friends on the same WiFi.

## What's inside

| File | What it does |
|------|---|
| `server.js` | Runs the game server (Node + Socket.io) |
| `game.js` | The card game logic — deck, swapping, win checks |
| `public/index.html` | All the screens you see |
| `public/game.js` | The browser side — sockets, drawing, clicks |
| `public/avatar.js` | Builds the little SVG character avatars |
| `public/style.css` | All the colors, layout, and gesture animations |

Built with vanilla JavaScript and SVG avatars — no big frameworks. Just a fun little weekend project. 💛

## Tips

- Bluff often! Throwing fake signals confuses opponents.
- Watch your teammate's face — don't miss the real signal.
- Don't click Stop unless you're pretty sure — wrong calls cost you the game.
- Cards refresh on the table every 5 seconds — keep swapping!

Have fun 🎉
