# kick-socket-proxy

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen?logo=node.js)](https://nodejs.org/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](LICENSE)
[![WebSocket](https://img.shields.io/badge/WebSocket-Pusher-purple)](https://pusher.com/)

> A lightweight Node.js WebSocket proxy that bridges your browser to [Kick.com](https://kick.com) live chat in real time.

Kick's Pusher server (`ws-us2.pusher.com`) rejects connections from `localhost` origins.  
This proxy connects **server-side** with `Origin: https://kick.com` and forwards all chat events to any local client.

---

## Architecture

```
Browser  (chat-test.html)
    │  ws://localhost:4000
    ▼
proxy-server/server.js     ← Node.js WebSocket proxy
    │  wss://ws-us2.pusher.com  (Origin: https://kick.com)
    ▼
Kick Pusher WebSocket      ← Live chat stream
```

---

## Features

- Real-time chat messages via Pusher protocol
- Automatic fallback across multiple Pusher endpoints
- Emote tokens (`[emote:ID:name]`) rendered as images from Kick CDN
- URLs turned into clickable links
- Hover pop-up showing user profile links
- Live / offline channel status via Kick public API
- Zero runtime dependencies beyond [`ws`](https://github.com/websockets/ws)

---

## Quick Start

### 1. Start the proxy server

```bash
cd proxy-server
npm install
npm start
# → Listening on ws://localhost:4000
```

### 2. Open the test client

```bash
# From the repo root — serve the whole directory statically
npx serve .
# Then open: http://localhost:<port>/chat-test.html
```

### 3. Change the channel

Edit `chat-test.html`, line ~351:

```js
const CHANNEL_SLUG = 'meyhanecidimitri'; // ← replace with any Kick channel slug
```

---

## Protocol Reference

| Parameter     | Value                                    |
|---------------|------------------------------------------|
| Pusher Key    | `32cbd69e4b950bf97679`                   |
| Pusher Host   | `ws-us2.pusher.com`                      |
| Channel fmt   | `chatrooms.{chatroom_id}.v2`             |
| Chat event    | `App\Events\ChatMessageEvent`            |
| Emote CDN     | `files.kick.com/emotes/{id}/fullsize`    |

---

## Project Structure

```
kick-socket-proxy/
├── proxy-server/
│   ├── server.js        # WebSocket proxy (Node.js ESM)
│   ├── package.json
│   └── package-lock.json
├── chat-test.html       # Standalone browser test client
├── .gitignore
└── README.md
```

---

## Requirements

- Node.js 18 or later
- A modern browser (for `chat-test.html`)

---

## Contributing

Pull requests are welcome. For major changes please open an issue first.  
See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

---

## License

[GPL-3.0](LICENSE)
