---
name: What Was Drawn — Project Context
description: Core project info for the Quiet Whiskers Oracle web app (gesture-controlled tarot reader)
type: project
---

"What Was Drawn" is the Quiet Whiskers Oracle — a gesture-controlled oracle card reading web app.

**Stack:** React 18 + Vite frontend, FastAPI Python backend, OpenAI GPT-4o-mini, MediaPipe hand gestures, Framer Motion animations.

**Key files:**
- Frontend: `/Users/unice/Projects/Personal/what-was-drawn/frontend/src/App.jsx` (main orchestrator, ~955 lines)
- Hook: `frontend/src/hooks/useOracle.js` (state: phase, userQuestion, deck, reading)
- Styles: `frontend/src/styles/globals.css` (Tailwind + custom CSS classes)
- Backend: `backend/app/routers/readings.py`, `backend/app/services/openai_service.py`

**Phase machine:** intro → question → shuffle → spread → reading → (gate or back to intro)

**Monetization:**
- Physical deck sold at `UNIKRE_DECK_URL_HERE` (placeholder — replace with unikre.com.au Shopify URL)
- Ko-fi support at `KOFI_URL_HERE` (placeholder — replace with actual Ko-fi URL)
- Soft gate: after 1st reading per session, clicking "Begin a New Reading" shows gate; share or Ko-fi click unlocks one more reading

**Why:** Ships worldwide physical deck (44 cards + guidebook). Owner is UNIKRE Trading © 2025.

**How to apply:** Replace UNIKRE_DECK_URL_HERE and KOFI_URL_HERE before any deploy. These strings appear in App.jsx (4 instances: 2 in ReadingPanel CTAs, 2 in GateScreen).
