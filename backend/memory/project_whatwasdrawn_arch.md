---
name: What Was Drawn — Architecture Notes
description: Architecture details for the Quiet Whiskers Oracle app — component structure and state flow
type: project
---

App state lives in `useOracle` hook. Components are mostly inline in App.jsx (ReadingCard, ReadingPanel, GateScreen) or separate files (PhaseIntro, PhaseQuestion, CardFan, DeckPile).

Styling: Mix of Tailwind utility classes + custom CSS classes in globals.css + inline React style objects. Font: Cormorant Garamond (serif, mystical) for display, Inter for labels.

Colors: gold = #d4af6c / rgba(212,175,108), deep bg = rgba(6,4,16), cream text = rgba(250,244,228).

No React Router — single SPA with phase-based conditional rendering wrapped in Framer Motion AnimatePresence.

Backend is optional — graceful fallback to local reading generation if AI unavailable.
