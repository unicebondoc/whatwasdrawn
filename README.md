# What Was Drawn
### A gesture-controlled oracle card experience.

✨ No clicks. No taps. Just your hands.

Point. Pinch. Open your palm. Let fate speak.

→ **Live:** https://whatwasdrawn.com  
→ **Creator:** [Unice Bondoc](https://unicebondoc.com) 
   · [Ko-fi](https://ko-fi.com/lifeofmooni)

---

### How it works
- 👆 **Point** at a card to hover
- 🤏 **Pinch** like you're sizing something tiny to select  
- 🤚 **Open your palm** to reveal your reading
- 👍👍 **Two thumbs up** to begin again

---

## Overview

**What Was Drawn** is a full-stack web application that lets users draw oracle cards using real hand gestures captured via webcam. The platform uses:

- **MediaPipe Hands** to classify gestures in real time (open palm, pinch, point, victory sign)
- **OpenAI GPT-4o** to generate personalised, poetic 3-card spread readings
- **Pinecone + LangChain RAG** to enrich readings with semantically retrieved card wisdom
- A **44-card cat-themed oracle deck** — the *Quiet Whiskers Oracle* — with full meanings, reversed meanings, imagery descriptions, elemental associations, and keywords

---

## Features

| Feature | Description |
|---|---|
| 🤚 Gesture Control | Open palm draws cards; pinch confirms; peace/victory resets |
| 🃏 44-Card Deck | Complete Quiet Whiskers Oracle with cat-themed art descriptions |
| 🤖 AI Readings | OpenAI GPT-4o generates unique, poetic 3-card narratives |
| 🔍 RAG Pipeline | Pinecone vector search retrieves relevant card context per reading |
| 🎨 Mystical UI | Dark theme, glowing cards, animated star field, fluid transitions |
| 📱 Responsive | Works on desktop and tablet |
| 🐳 Docker | One-command startup via `docker-compose up` |

---

## Tech Stack

```
Frontend    React 18 · Vite · Tailwind CSS · Framer Motion · MediaPipe Hands
Backend     Python 3.12 · FastAPI · Uvicorn
AI          OpenAI GPT-4o
RAG         LangChain · Pinecone (serverless)
Embeddings  OpenAI text-embedding-ada-002
Container   Docker · docker-compose
```

---

## Getting Started

### Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- An **OpenAI API key**
- A **Pinecone API key** — [sign up free at Pinecone](https://app.pinecone.io) *(optional — app works without it, RAG is disabled)*

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd what-was-drawn

cp .env.example .env
# Edit .env and add your API keys
```

### 2. Launch with Docker

```bash
docker-compose up --build
```

- Frontend → [http://localhost:3000](http://localhost:3000)
- Backend API → [http://localhost:8000](http://localhost:8000)
- API docs → [http://localhost:8000/docs](http://localhost:8000/docs)

On first boot, the backend will automatically embed all 44 oracle cards into Pinecone (requires both API keys).

### Updating Docker after code changes

Rebuild and restart the frontend (or full stack):

```bash
docker compose build frontend && docker compose up -d frontend
```

**Auto-rebuild on save:** run with watch (Docker Compose 2.22+). When you change files under `frontend/`, the frontend image rebuilds and the container restarts.

```bash
docker compose watch
```

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Create .env in the backend directory (or export variables)
cp ../.env.example .env

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:8000`.

---

## Gesture Reference

| Gesture | Action |
|---|---|
| ✋ Open Palm | Draw a 3-card spread |
| ☝️ Point (index only) | Draw a single card |
| ✌️ Victory / Peace | Reset the oracle |
| 🤏 Pinch (thumb + index) | Confirm / select |

Hold each gesture steady for ~1 second. If no camera is available, use the **Draw Cards** button.

---

## The Quiet Whiskers Oracle Deck

The 44-card deck is fully defined in [`backend/app/data/oracle_cards.json`](backend/app/data/oracle_cards.json). Each card includes:

```json
{
  "id": 1,
  "name": "The Dreaming Sphinx",
  "keywords": ["mystery", "ancient wisdom", "inner knowing", "patience"],
  "meaning": "...",
  "reversed_meaning": "...",
  "imagery": "...",
  "element": "Air",
  "number": 1
}
```

Cards span five elements — **Air, Water, Fire, Earth, Spirit** — and cover the full arc of human experience through the lens of cat wisdom.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health + connection status |
| `GET` | `/api/cards/` | All 44 oracle cards |
| `GET` | `/api/cards/{id}` | Single card by ID |
| `GET` | `/api/cards/random/{n}` | N random cards with orientation |
| `POST` | `/api/readings/draw` | Draw cards and generate AI reading |
| `POST` | `/api/readings/interpret` | Reading for specific card IDs |

### Draw a reading

```bash
curl -X POST http://localhost:8000/api/readings/draw \
  -H "Content-Type: application/json" \
  -d '{"spread_type": "three_card"}'
```

Response:
```json
{
  "spread_type": "three_card",
  "cards": [
    {
      "position": 0,
      "position_name": "Past",
      "card": { "id": 7, "name": "The Sunbather", ... },
      "is_reversed": false
    }
  ],
  "narrative": "The oracle whispers through the veil...",
  "created_at": "2026-03-16T12:00:00+00:00"
}
```

---

## Project Structure

```
what-was-drawn/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WebcamFeed.jsx       # Webcam + landmark overlay
│   │   │   ├── OracleCard.jsx       # Animated flip card
│   │   │   ├── CardSpread.jsx       # 3-card layout
│   │   │   ├── ReadingNarrative.jsx # AI reading display
│   │   │   ├── LoadingOracle.jsx    # Loading animation
│   │   │   ├── GestureGuide.jsx     # Gesture reference modal
│   │   │   └── StarField.jsx        # Background stars
│   │   ├── hooks/
│   │   │   ├── useMediaPipe.js      # Gesture detection hook
│   │   │   └── useOracle.js         # API + reading state hook
│   │   ├── styles/globals.css
│   │   └── App.jsx
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app + lifespan
│   │   ├── routers/
│   │   │   ├── cards.py             # Card endpoints
│   │   │   └── readings.py          # Reading generation
│   │   ├── services/
│   │   │   ├── openai_service.py    # OpenAI GPT-4o
│   │   │   └── pinecone_service.py  # Pinecone RAG
│   │   ├── models/schemas.py        # Pydantic models
│   │   └── data/oracle_cards.json   # 44-card deck
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes (for AI readings) | OpenAI API key |
| `PINECONE_API_KEY` | No (for RAG) | Pinecone API key |
| `PINECONE_INDEX` | No | Index name (default: `what-was-drawn`) |
| `PINECONE_ENV` | No | Region (default: `us-east-1`) |
| `VITE_API_URL` | No | Frontend API base URL override |

The app degrades gracefully: without OpenAI, a fallback reading is used; without Pinecone, readings skip the RAG step.

---

## Card Images

Card artwork lives in `frontend/public/cards/` and is served at `/cards/card-{id}.png` (1–44) plus `/cards/card-back.png`. Nginx caches all images for one year via the `Cache-Control: public, immutable` header already present in `frontend/nginx.conf`.

> **Production note:** The raw card images are ~4.9 MB each. Optimise them to ~200 KB before deploying to production using a tool such as [Squoosh](https://squoosh.app), `sharp`, or `imagemagick` (`mogrify -quality 80 -resize 800x> *.png`). This reduces initial load time by ~24× per card.

---

## Creator
Built by **Unice Bondoc** — AI Software Engineer & creative technologist.
- 🌐 Portfolio: [unicebondoc.com](https://unicebondoc.com)
- ✍️ Blog: [medium.com/@unicebondoc](https://medium.com/@unicebondoc)
- ☕ Ko-fi: [ko-fi.com/lifeofmooni](https://ko-fi.com/lifeofmooni)
- 🃏 Physical deck: [unikre.com.au](https://unikre.com.au)

---

## License

MIT — use freely for portfolio, learning, or creative projects.

---

*"The cat does not explain itself. It simply knows."*
*— The Quiet Whiskers Oracle*
# rebuild
