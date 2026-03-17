import { useState, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Local reading generator — used when backend / AI is unavailable ──────────
function generateLocalReading(selectedCards, deck) {
  const POSITIONS = ['Past', 'Present', 'Future']

  const cards = selectedCards.map((sel, i) => {
    const card = deck.find(c => String(c.id) === String(sel.id))
    if (!card) return null

    // Use meaning (upright) or shadow_aspect (reversed); trim to ~2 sentences
    const raw = sel.isReversed ? (card.shadow_aspect || card.meaning) : card.meaning
    const sentences = (raw || '').match(/[^.!?…]+[.!?…]+/g) || []
    const insight = sentences.slice(0, 2).join(' ').trim() || (raw || '').slice(0, 220)

    return {
      position: i,
      position_name: POSITIONS[i],
      card,
      is_reversed: sel.isReversed,
      insight,
    }
  }).filter(Boolean)

  // Build the closing whisper from each card's invitation/need
  const threads = cards.map(c => c.card.invitation || c.card.need || c.card.state).filter(Boolean)
  let whisper
  if (threads.length === 3) {
    whisper = `The cards reveal a path from ${threads[0].toLowerCase()} through ${threads[1].toLowerCase()} toward ${threads[2].toLowerCase()}. Whatever you are carrying, these cards are a mirror — trust what stirs in you as you sit with them.`
  } else {
    whisper = `The oracle has drawn near. Sit with what these cards have shown you — answers often arrive not as words, but as feelings that quietly settle into place.`
  }

  return {
    spread_type: 'three_card',
    cards,
    whisper,
    created_at: new Date().toISOString(),
    is_local: true, // flag so UI can optionally note the source
  }
}

// Phases: intro → question → shuffle → spread → reveal → reading
export function useOracle() {
  const [phase, setPhase]               = useState('intro')
  const [userQuestion, setUserQuestion] = useState('')
  const [deck, setDeck]                 = useState([])
  const [deckReady, setDeckReady]       = useState(false)
  const [reading, setReading]           = useState(null)
  const [pendingSelection, setPendingSelection] = useState(null)
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState(null)
  const [loadError, setLoadError]       = useState(null)

  // Stable refs so callbacks always see latest values without stale closures
  const userQuestionRef = useRef('')
  userQuestionRef.current = userQuestion
  const deckRef = useRef([])
  deckRef.current = deck

  // ── Deck loading — tries backend first, falls back to static JSON ──────────
  const loadDeck = useCallback(async () => {
    setLoadError(null)
    try {
      const res = await axios.get(`${API_BASE}/cards/`)
      setDeck(shuffle(res.data))
      setDeckReady(true)
    } catch {
      // Backend offline — fall back to bundled static deck
      try {
        const res = await axios.get('/data/oracle_cards.json')
        setDeck(shuffle(res.data))
        setDeckReady(true)
      } catch (err2) {
        console.error('Failed to load deck:', err2)
        setLoadError('Could not load cards. Check the connection and try again.')
      }
    }
  }, [])

  useEffect(() => { loadDeck() }, [loadDeck])

  // ── Phase transitions ─────────────────────────────────────────────────────

  const beginReading    = useCallback(() => setPhase('question'), [])
  const submitQuestion  = useCallback((q) => { setUserQuestion(q ?? ''); setPhase('shuffle') }, [])
  const onShuffleComplete = useCallback(() => setPhase('spread'), [])

  // ── Draw — tries AI backend, falls back to local reading ─────────────────
  const drawFromSelection = useCallback(async (selectedCards, questionOverride = null) => {
    setError(null)
    setPendingSelection(selectedCards)
    setIsLoading(true)
    setPhase('reading')

    const q = questionOverride ?? userQuestionRef.current ?? ''
    const body = {
      cards: selectedCards.map(c => ({ id: c.id, is_reversed: c.isReversed })),
      spread_type: 'three_card',
      question: String(q ?? '').trim(),
    }

    try {
      const [response] = await Promise.all([
        axios.post(`${API_BASE}/readings/interpret`, body),
        new Promise(resolve => setTimeout(resolve, 800)),
      ])
      setReading(response.data)
      setPendingSelection(null)
    } catch {
      // AI backend unavailable — generate reading from card data
      try {
        await new Promise(resolve => setTimeout(resolve, 600)) // brief pause for UX
        const localReading = generateLocalReading(selectedCards, deckRef.current)
        setReading(localReading)
        setPendingSelection(null)
      } catch (localErr) {
        console.error('Local reading failed:', localErr)
        setError('The oracle could not be reached. Please try again.')
        setPhase('spread')
        setPendingSelection(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Full reset ────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setPhase('intro')
    setUserQuestion('')
    setReading(null)
    setPendingSelection(null)
    setError(null)
    setIsLoading(false)
    setDeck(prev => shuffle(prev))
  }, [])

  return {
    phase, userQuestion, deck, deckReady,
    reading, pendingSelection, isLoading, error, loadError,
    beginReading, submitQuestion, onShuffleComplete,
    drawFromSelection, reset, retryLoadDeck: loadDeck,
  }
}
