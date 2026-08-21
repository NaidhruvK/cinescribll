# 🎬 CineScribbl - Multiplayer Telugu Movie Drawing & Guessing Game

> **"Draw the Movie. Guess the Movie."**

CineScribbl is a real-time multiplayer online drawing-and-guessing party game themed around **Telugu Cinema (Tollywood)**. Players join private rooms, take turns as the artist to illustrate iconic Telugu movies, and battle in live chat to guess the title before the timer runs out!

---

## 🌟 Key Features

- **Genuine Real-Time Multiplayer**: Built on Node.js, Express, and Socket.IO with server-authoritative game state and smooth sub-second drawing stroke synchronization.
- **100% Telugu Movie Dataset**: Curated directly from the CineScribbl Master Dataset (200+ movies from classics like *Athadu*, *Pokiri*, *Simhadri* to *Kalki 2898 AD*, *Pushpa*, *Salaar*, *DJ Tillu*, *Eega*, etc.).
- **Private Game Lobbies**: Create custom 6-character room codes (e.g. `TOLLY9`, `CINEMA`) supporting 2 to 12 players.
- **Skribbl.io Gameplay & Scoring**:
  - 3-choice Telugu movie picker for the artist.
  - Progressive letter hint reveals as time counts down.
  - Dynamic speed-based scoring (faster correct guesses earn up to 550+ points).
  - Artist reward points scaled to successful guessers.
  - Intelligent fuzzy matching (normalizes spaces, uppercase/lowercase, punctuation differences) and private "Close!" feedback.
- **HTML5 Canvas Drawing Suite**: Multi-size brushes, erasers, 16-color cinematic palette, undo, and canvas clear.
- **Cinematic Red Identity**: Sleek dark charcoal and rich crimson aesthetic inspired by Indian cinema theatres with synthesized Web Audio sound effects (fanfares, chimes, clock ticks, victory theme) and confetti celebrations.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, Socket.IO Server
- **Audio**: Web Audio API (zero external asset dependencies)
- **Data**: Master Dataset (`server/data/movies.json`)

---

## 📁 Project Structure

```
├── server.ts                    # Express + Socket.IO server & Vite middleware
├── server/
│   ├── data/
│   │   ├── movies.json          # Master 200+ Telugu movie list (from PDF dataset)
│   │   └── movieService.ts      # Dataset loader & randomizer
│   ├── game/
│   │   ├── roomManager.ts       # Server-authoritative room & game state engine
│   │   └── scoring.ts           # Scoring algorithms & fuzzy guess matcher
│   ├── socket/
│   │   └── gameSocket.ts        # Real-time WebSocket event dispatcher
│   └── seed.ts                  # Dataset validator and seeder
├── src/
│   ├── components/
│   │   ├── Navbar.tsx           # Brand header, room code copy, audio mute
│   │   ├── Home.tsx             # Landing hero & game preview
│   │   ├── CreateRoomModal.tsx  # Room creator with settings & avatars
│   │   ├── JoinRoomModal.tsx    # Room joiner with code validator
│   │   ├── Lobby.tsx            # Pre-game lobby with player cards & host controls
│   │   ├── DrawingCanvas.tsx    # HTML5 interactive canvas & artist toolbar
│   │   ├── ChatPanel.tsx        # Live guess stream & emoji reaction drawer
│   │   ├── PlayerSidebar.tsx    # Live scoreboard & player status badges
│   │   ├── MovieChoiceModal.tsx # Artist 3-option movie selector
│   │   ├── RoundEndOverlay.tsx  # Secret movie reveal & score breakdown
│   │   ├── GameOverModal.tsx    # Podium celebration & final standings
│   │   └── HowToPlayModal.tsx   # Rules & scoring guide
│   ├── constants/
│   │   └── avatars.ts           # Tollywood-themed avatar definitions
│   ├── hooks/
│   │   ├── useSocket.ts         # Socket.IO client integration
│   │   └── useAudio.ts          # Web Audio API sound synthesizers
│   ├── types.ts                 # Shared TypeScript data contracts
│   ├── App.tsx                  # Main router & game view orchestrator
│   └── index.css                # Tailwind CSS styling & animations
└── package.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Verify Movie Dataset

```bash
npm run seed
```

### 3. Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. Open multiple tabs or share the room code to play with friends!

---

## 🎮 How It Works

1. **Host Creates a Room**: Choose max players (2-12), rounds (1-10), and draw time (60-120s).
2. **Players Join**: Enter the 6-character room code, select a fun cinematic avatar (Hero, Director, Popcorn, etc.).
3. **Artist's Turn**: Receives 3 secret Telugu movie choices. Once selected, other players see masked hints (e.g., `_ _ _ _ _ _`).
4. **Drawing & Guessing**: The artist illustrates clues on the canvas while guessers type in the chat.
5. **Score & Win**: Faster guesses earn higher points! After all rounds, the top 3 champions are celebrated on the podium.

---

## 🔒 Security & Anti-Cheat

- Secret movie titles and options are **never sent to non-artist clients**.
- All guess validation and scoring are executed strictly server-side.
- Canvas stroke rate-limiting and non-artist drawing prevention.

Enjoy **CineScribbl**! 🍿
