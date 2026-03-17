import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import StarField        from './components/StarField'
import WebcamFeed       from './components/WebcamFeed'
import CardFan          from './components/CardFan'
import DeckPile         from './components/DeckPile'
import FingerCursor     from './components/FingerCursor'
import LoadingOracle    from './components/LoadingOracle'
import PhaseIntro       from './components/PhaseIntro'
import PhaseQuestion    from './components/PhaseQuestion'
import { useOracle }    from './hooks/useOracle'

const MAX_SELECTIONS = 3
const PINCH_HOLD_MS  = 280

// Soft chime when the oracle's reading appears
function playReadingChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0.0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.7)
    osc.onended = () => ctx.close()
  } catch {
    // Audio not available
  }
}

const SLOT_NUMERALS = ['I', 'II', 'III']

// ── Card slot in the spread phase — 100×145 ──────────────────────────────────
function CardSlot({ label, card, slotIndex }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Position label */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{
          color: 'rgba(210,200,240,0.85)', fontSize: '9px',
          letterSpacing: '0.35em', textTransform: 'uppercase',
          fontFamily: 'Raleway, sans-serif', marginBottom: 3,
        }}>
          {SLOT_NUMERALS[slotIndex]}
        </div>
        <span style={{
          color: 'rgba(255,248,235,0.95)', fontSize: '11px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          fontFamily: 'Raleway, sans-serif', fontWeight: 600,
          textShadow: '0 1px 6px rgba(0,0,0,0.5)',
        }}>
          {label}
        </span>
      </div>

      <div style={{ width: 100, height: 145 }}>
        {card ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              width: '100%', height: '100%',
              borderRadius: 10, overflow: 'hidden',
              border: '1px solid rgba(212,175,108,0.35)',
              boxShadow: '0 0 20px rgba(212,175,108,0.2), 0 8px 24px rgba(0,0,0,0.7)',
            }}
          >
            <img src="/cards/card-back.png" alt="" draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </motion.div>
        ) : (
          /* Dashed frame */
          <div style={{
            width: '100%', height: '100%', borderRadius: 10,
            border: '1.5px dashed rgba(212,175,108,0.2)',
            background: 'rgba(232,220,200,0.01)',
          }} />
        )}
      </div>
    </div>
  )
}

const READING_NUMERALS = ['I', 'II', 'III']

// ── Reading phase card — 160×240, auto-flip ──────────────────────────────────
function ReadingCard({ cardData, index, revealed }) {
  const { card, is_reversed, position_name, insight } = cardData
  const [faceUp, setFaceUp] = useState(false)

  useEffect(() => {
    if (!revealed) { setFaceUp(false); return }
    const t = setTimeout(() => setFaceUp(true), 300 + index * 300)
    return () => clearTimeout(t)
  }, [revealed, index])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Position label */}
      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <div style={{
          color: 'rgba(210,200,240,0.6)', fontSize: '9px',
          fontFamily: 'Raleway, sans-serif', letterSpacing: '0.35em',
          textTransform: 'uppercase', marginBottom: 4,
        }}>
          {READING_NUMERALS[index]}
        </div>
        <div style={{
          fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
          fontFamily: 'Raleway, sans-serif', fontWeight: 600,
          color: 'rgba(210,195,255,0.7)',
          textShadow: '0 1px 6px rgba(0,0,0,0.5)',
        }}>
          {position_name}
        </div>
      </div>

      {/* Card flip */}
      <div style={{ width: 160, height: 240, perspective: '1000px', flexShrink: 0 }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: faceUp
            ? (is_reversed ? 'rotateY(180deg) rotate(180deg)' : 'rotateY(180deg)')
            : 'rotateY(0deg)',
        }}>
          {/* Back face */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden',
            backfaceVisibility: 'hidden',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.06)',
          }}>
            <img src="/cards/card-back.png" alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          {/* Front face */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden',
            backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.18)',
          }}>
            <img
              src={`/cards/card-${card?.id}.png`}
              alt={card?.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Vignette */}
            <div style={{
              position: 'absolute', inset: 0,
              boxShadow: 'inset 0 0 28px rgba(0,0,0,0.35)',
              borderRadius: 14, pointerEvents: 'none',
            }} />
          </div>
        </div>
      </div>

      {/* Reversed badge — below card, above name */}
      {faceUp && is_reversed && (
        <div style={{
          marginTop: 10,
          background:    'rgba(180,100,255,0.25)',
          border:        '1px solid rgba(180,100,255,0.5)',
          color:         'rgba(220,180,255,0.95)',
          fontSize:      '10px',
          letterSpacing: '0.15em',
          padding:       '3px 10px',
          borderRadius:  '20px',
          fontFamily:    'Raleway, sans-serif',
          fontWeight:    500,
          textTransform: 'uppercase',
          whiteSpace:    'nowrap',
        }}>
          REVERSED
        </div>
      )}

      {/* Post-reveal: name, keywords, insight panel */}
      <AnimatePresence>
        {faceUp && (
          <motion.div
            key="labels"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ marginTop: is_reversed ? 10 : 20, textAlign: 'center', width: '100%' }}
          >
            {/* Card name */}
            <div style={{
              fontFamily:    'Cormorant Garamond, Georgia, serif',
              fontSize:      '22px',
              fontWeight:    600,
              fontStyle:     'normal',
              color:         'rgba(255,248,235,1)',
              letterSpacing: '0.02em',
              lineHeight:    1.2,
              textAlign:     'center',
            }}>
              {card?.name}
            </div>

            {/* Keywords */}
            {card?.keywords && (
              <div style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontStyle: 'italic', fontSize: '13px',
                color: 'rgba(200,180,255,0.7)', marginTop: 6,
                letterSpacing: '0.03em', textAlign: 'center',
              }}>
                {Array.isArray(card.keywords)
                  ? card.keywords.slice(0, 3).join(' · ')
                  : card.keywords}
              </div>
            )}

            {/* Insight panel */}
            {insight && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.55 }}
                style={{
                  marginTop:            16,
                  padding:              '28px 28px',
                  background:           'rgba(20,10,45,0.5)',
                  backdropFilter:       'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border:               '1px solid rgba(255,255,255,0.08)',
                  borderRadius:         20,
                }}
              >
                <p style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize:   '17px',
                  color:      'rgba(240,228,255,0.95)',
                  lineHeight: 1.95,
                  margin:     0,
                  fontStyle:  'italic',
                  textAlign:  'center',
                }}>
                  {insight}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Unified oracle reading panel — the final whisper ────────────────────────
function ReadingPanel({ whisper, isLoading, onReset, onWhisperRevealed }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.7, ease: 'easeOut' }}
      style={{ width: '100%', maxWidth: 680, margin: '68px auto 0' }}
    >
      {/* Divider rule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(212,175,108,0.2))' }} />
        <span style={{
          color: 'rgba(200,180,255,0.6)', fontSize: '11px',
          letterSpacing: '0.2em', fontFamily: 'Raleway, sans-serif',
          fontWeight: 500, fontStyle: 'normal',
          textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          the oracle's whisper
        </span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(212,175,108,0.2))' }} />
      </div>

      {/* Content */}
      {isLoading && !whisper ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <LoadingOracle phase="reading" />
        </div>
      ) : whisper ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.75, duration: 0.85 }}
            onAnimationComplete={() => onWhisperRevealed?.()}
            style={{
              background:           'rgba(20,10,45,0.5)',
              backdropFilter:       'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border:               '1px solid rgba(255,255,255,0.08)',
              borderRadius:         20,
              padding:              '28px 28px',
            }}
          >
            <p style={{
              fontFamily:    'Cormorant Garamond, Georgia, serif',
              fontSize:      '19px',
              fontWeight:    300,
              color:         'rgba(240,228,255,0.95)',
              lineHeight:    1.95,
              margin:        0,
              fontStyle:     'italic',
              letterSpacing: '0.02em',
              textAlign:     'center',
            }}>
              {whisper}
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              style={{
                marginTop: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                color: 'rgba(212,175,108,0.25)', fontSize: '0.7rem',
              }}
            >
              <span>✦</span><span>✦</span><span>✦</span>
            </motion.div>
          </motion.div>

          {/* Support CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.7 }}
            style={{
              textAlign: 'center',
              marginTop: 36,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}
          >
            <p style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '17px', fontStyle: 'italic',
              color: 'rgba(235,225,255,0.92)', margin: 0,
            }}>
              ✨ Was this reading helpful?
            </p>
            <p style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '13px',
              color: 'rgba(210,200,240,0.65)', margin: 0,
              letterSpacing: '0.03em',
            }}>
              The oracle runs on moonlight and coffee.
            </p>
            <a
              href="https://ko-fi.com/lifeofmooni"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mystical-primary"
              style={{ marginTop: 6, display: 'inline-block', textDecoration: 'none' }}
            >
              ☕ Buy the oracle a coffee
            </a>
          </motion.div>

          {/* Begin a New Reading */}
          {onReset && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.9 }}
              style={{ textAlign: 'center', marginTop: 16 }}
            >
              <button onClick={onReset} className="btn-mystical-primary">
                Begin a New Reading
              </button>
              <p style={{
                fontFamily:    'Raleway, sans-serif',
                fontSize:      '14px',
                color:         'rgba(235,220,255,0.78)',
                textShadow:    '0 1px 6px rgba(0,0,0,0.4)',
                letterSpacing: '0.05em',
                margin:        '10px 0 0',
                textAlign:     'center',
              }}>
                👍👍 Two thumbs up to begin again
              </p>
            </motion.div>
          )}
        </>
      ) : null}
    </motion.div>
  )
}

// ── Soft gate overlay (after 3 readings) ─────────────────────────────────────
function SoftGate({ onSupport }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
          background: 'rgba(20, 10, 45, 0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(180, 140, 255, 0.2)',
          borderRadius: 24,
          padding: '48px 36px',
          boxShadow: '0 22px 70px rgba(0,0,0,0.75)',
        }}
      >
        <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 18 }}>🌙</div>
        <div
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontStyle: 'italic',
            fontSize: 28,
            color: 'rgba(255, 248, 235, 0.97)',
            marginBottom: 14,
          }}
        >
          The oracle grows tired...
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            color: 'rgba(210, 190, 255, 0.85)',
            lineHeight: 1.6,
            marginBottom: 22,
            whiteSpace: 'pre-line',
          }}
        >
          {'You have received three readings today.\nThe cards need time to rest — and so do you.'}
        </div>

        <a
          href="https://ko-fi.com/lifeofmooni"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-mystical-primary"
          style={{ display: 'inline-block', textDecoration: 'none' }}
          onClick={onSupport}
        >
          ☕ Support the oracle to continue
        </a>

        <div
          style={{
            marginTop: 16,
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            color: 'rgba(180, 160, 255, 0.6)',
          }}
        >
          ✨ Come back tomorrow for more readings.
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const {
    phase, userQuestion, deck, deckReady,
    reading, pendingSelection, isLoading, error, loadError,
    beginReading, submitQuestion, onShuffleComplete,
    drawFromSelection, reset, retryLoadDeck,
  } = useOracle()

  // ── Camera toggle (persisted) ─────────────────────────────────────────────
  const [cameraEnabled, setCameraEnabled] = useState(() => {
    try {
      const raw = localStorage.getItem('wwd_camera_enabled')
      if (raw === null) return true
      return raw === 'true'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('wwd_camera_enabled', String(cameraEnabled))
    } catch {
      // ignore
    }
  }, [cameraEnabled])

  const deckPileRef      = useRef(null)
  const questionInputRef = useRef('')

  // ── Card selection state ───────────────────────────────────────────────────
  const [selectedCards, setSelectedCards] = useState([])
  const selectedCardsRef  = useRef([])
  selectedCardsRef.current = selectedCards

  const selectedSet = useMemo(
    () => new Set(selectedCards.map(c => c.fanIndex)),
    [selectedCards],
  )

  // ── CardFan ref — receives imperative updateFingerPos calls ────────────────
  const cardFanRef = useRef(null)

  // ── Hovered card (reported by CardFan via onHoverChange) — used for pinch ──
  const hoveredCardRef   = useRef(null)
  const selectedCountRef = useRef(0)
  selectedCountRef.current = selectedCards.length

  const handleHoverChange = useCallback((index) => {
    hoveredCardRef.current = index
  }, [])

  // ── Cursor / pinch refs ────────────────────────────────────────────────────
  const cursorPosRef    = useRef(null)
  const isPinchingRef   = useRef(false)
  const prevGestureRef  = useRef(null)
  const pinchStartRef   = useRef(null)
  const pinchSelectFired = useRef(false)
  const pinchProgressRef = useRef(0)  // for FingerCursor API

  // ── Cards revealed in reading phase ───────────────────────────────────────
  const [cardsRevealed, setCardsRevealed] = useState(false)
  useEffect(() => {
    if (phase === 'reading') {
      const t = setTimeout(() => setCardsRevealed(true), 700)
      return () => clearTimeout(t)
    }
    setCardsRevealed(false)
  }, [phase])

  // ── Floating scroll indicator for reading phase ───────────────────────────
  const readingScrollRef = useRef(null)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  useEffect(() => {
    if (phase !== 'reading') { setShowScrollIndicator(false); return }
    const el = readingScrollRef.current
    if (!el) return

    const check = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
      const hasOverflow = el.scrollHeight > el.clientHeight + 2
      const nearBottom = remaining <= 100
      setShowScrollIndicator(hasOverflow && !nearBottom)
    }

    const t = setTimeout(check, 250)
    el.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })
    return () => {
      clearTimeout(t)
      el.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [phase])

  // ── Reading limit (3 free) + soft gate ─────────────────────────────────────
  const isPreview = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get('preview') === 'true' } catch { return false }
  }, [])

  const COUNT_KEY = 'wwd_reading_count'
  const SUPPORTED_KEY = 'wwd_supported'

  const [readingCount, setReadingCount] = useState(() => {
    try { return parseInt(localStorage.getItem(COUNT_KEY) || '0') || 0 } catch { return 0 }
  })
  const [showSoftGate, setShowSoftGate] = useState(false)
  const lastCountedWhisperRef = useRef(null)

  const shouldGateBeforeReading = useCallback(() => {
    if (isPreview) return false
    try {
      const count = parseInt(localStorage.getItem(COUNT_KEY) || '0') || 0
      // keep state in sync for UI; gating must rely on storage (survives refresh)
      if (count !== readingCount) setReadingCount(count)
      return count >= 3
    } catch {
      return readingCount >= 3
    }
  }, [COUNT_KEY, isPreview, readingCount])

  const startReadingFromSelection = useCallback(() => {
    if (shouldGateBeforeReading()) {
      setShowSoftGate(true)
      return
    }
    drawFromSelection(selectedCardsRef.current, userQuestion)
  }, [shouldGateBeforeReading, drawFromSelection, userQuestion])

  const handleWhisperRevealed = useCallback(() => {
    if (isPreview) return
    const signature = reading?.created_at || reading?.whisper
    if (!signature) return
    if (lastCountedWhisperRef.current === signature) return
    lastCountedWhisperRef.current = signature
    setReadingCount(prev => {
      const next = prev + 1
      try { localStorage.setItem(COUNT_KEY, String(next)) } catch {}
      return next
    })
  }, [isPreview, reading?.created_at, reading?.whisper])

  const handleSupportOracle = useCallback(() => {
    try {
      localStorage.setItem(SUPPORTED_KEY, 'true')
      localStorage.setItem(COUNT_KEY, '0')
    } catch {}
    setReadingCount(0)
    setShowSoftGate(false)
  }, [])

  // ── Per-frame pointer handler (MediaPipe → finger position + gestures) ─────
  const handlePointerMove = useCallback((pos, gesture) => {
    cursorPosRef.current  = pos
    isPinchingRef.current = gesture === 'pinch'

    // Always forward position to CardFan for angle-based hover detection
    if (phase === 'spread') {
      cardFanRef.current?.updateFingerPos(pos)
    }

    if (!pos) {
      pinchStartRef.current    = null
      pinchSelectFired.current = false
      pinchProgressRef.current = 0
      prevGestureRef.current   = null
      return
    }

    if (phase !== 'spread') {
      prevGestureRef.current = gesture
      return
    }

    const isPinch  = gesture === 'pinch'
    const wasPinch = prevGestureRef.current === 'pinch'
    const now      = Date.now()

    if (isPinch) {
      if (!wasPinch) {
        pinchStartRef.current    = now
        pinchSelectFired.current = false
      }
      const held = now - (pinchStartRef.current ?? now)
      if (held >= PINCH_HOLD_MS && !pinchSelectFired.current) {
        const idx = hoveredCardRef.current
        if (idx !== null && !selectedSet.has(idx) && selectedCountRef.current < MAX_SELECTIONS) {
          const card = deck[idx]
          if (card) {
            pinchSelectFired.current = true
            const isReversed = Math.random() < 0.25
            setSelectedCards(prev => [...prev, { fanIndex: idx, id: card.id, isReversed }])
          }
        }
      }
    } else {
      pinchStartRef.current    = null
      pinchSelectFired.current = false
    }

    prevGestureRef.current = gesture
  }, [phase, selectedSet, deck])

  // ── Click on fan card (mouse) ──────────────────────────────────────────────
  const handleFanCardClick = useCallback((index) => {
    if (phase !== 'spread' || selectedSet.has(index)) return
    if (selectedCards.length >= MAX_SELECTIONS) return
    const card = deck[index]
    if (!card) return
    const isReversed = Math.random() < 0.25
    setSelectedCards(prev => [...prev, { fanIndex: index, id: card.id, isReversed }])
  }, [phase, selectedSet, selectedCards.length, deck])

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setSelectedCards([])
    hoveredCardRef.current   = null
    pinchStartRef.current    = null
    pinchSelectFired.current = false
    pinchProgressRef.current = 0
    prevGestureRef.current   = null
    reset()
  }, [reset])

  // ── Gesture handler (phase-level gestures) ─────────────────────────────────
  const handleGesture = useCallback((gestureName) => {
    if (gestureName === 'open_palm' && phase === 'intro') {
      beginReading()
      return
    }
    if ((gestureName === 'victory' || gestureName === 'fist') && phase === 'question') {
      submitQuestion(questionInputRef.current)
      return
    }
    if (gestureName === 'both_thumbs_up') {
      if (phase === 'shuffle') { deckPileRef.current?.shuffle?.(); return }
      if (phase === 'spread' || phase === 'reading') { handleReset(); return }
    }
    if (gestureName === 'open_palm' && phase === 'spread' && selectedCountRef.current === MAX_SELECTIONS) {
      startReadingFromSelection()
    }
  }, [phase, startReadingFromSelection, beginReading, submitQuestion, handleReset])

  const handleBothPalmsOpen = useCallback(() => {
    if (phase === 'intro') beginReading()
  }, [phase, beginReading])

  // ── Reading data ───────────────────────────────────────────────────────────
  const readingData = useMemo(() => {
    if (reading) return reading
    if (pendingSelection?.length) {
      return {
        cards: pendingSelection.map((sel, i) => {
          const card = deck.find(c => c.id === sel.id)
          return card
            ? { card, is_reversed: sel.isReversed, position_name: ['Past', 'Present', 'Future'][i] }
            : null
        }).filter(Boolean),
      }
    }
    return null
  }, [reading, pendingSelection, deck])

  // Chime on new reading
  const lastNarrativeRef = useRef(null)
  useEffect(() => {
    const signal = reading?.whisper ?? reading?.narrative
    if (phase !== 'reading' || !signal) return
    if (signal === lastNarrativeRef.current) return
    lastNarrativeRef.current = signal
    playReadingChime()
  }, [phase, reading?.whisper, reading?.narrative])

  const selectionCount = selectedCards.length

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage:    'url(/background.png)',
        backgroundSize:     'cover',
        backgroundPosition: 'center',
        backgroundRepeat:   'no-repeat',
      }}
    >
      <StarField count={120} />

      {phase === 'spread' && cameraEnabled && (
        <FingerCursor
          posRef={cursorPosRef}
          pinchingRef={isPinchingRef}
          pinchProgressRef={pinchProgressRef}
        />
      )}

      {/* ══════════ PHASE 1: INTRO ══════════ */}
      <AnimatePresence>
        {phase === 'intro' && (
          <PhaseIntro
            key="intro"
            onBegin={beginReading}
            cameraEnabled={cameraEnabled}
          />
        )}
      </AnimatePresence>

      {/* ══════════ PHASE 2: QUESTION ══════════ */}
      <AnimatePresence>
        {phase === 'question' && (
          <PhaseQuestion
            key="question"
            onSubmit={submitQuestion}
            onSkip={() => submitQuestion('')}
            onQuestionChange={q => { questionInputRef.current = q }}
            cameraEnabled={cameraEnabled}
          />
        )}
      </AnimatePresence>

      {/* ══════════ PHASE 3: SHUFFLE ══════════ */}
      <AnimatePresence>
        {phase === 'shuffle' && (
          <motion.div
            key="shuffle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className="absolute inset-0"
          >
            <DeckPile ref={deckPileRef} onShuffleComplete={onShuffleComplete} autoStart />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ PHASE 4: SPREAD — loading fallback while deck fetches ══════════ */}
      {phase === 'spread' && !deckReady && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LoadingOracle phase="deck" />
        </div>
      )}

      {/* ══════════ PHASE 4: SPREAD ══════════ */}
      <AnimatePresence>
        {phase === 'spread' && deckReady && (
          <motion.div
            key="spread"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Card slots — 100×145, centered above arc */}
            <div style={{
              position: 'absolute', top: '80px', bottom: '52vh',
              left: 0, right: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14,
            }}>
              <div style={{
                background: 'rgba(20,10,40,0.45)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: 16,
                padding: '20px 36px 24px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end' }}>
                  {['Past', 'Present', 'Future'].map((label, i) => {
                    const sel  = selectedCards[i]
                    const card = sel ? deck[sel.fanIndex] : null
                    return <CardSlot key={i} label={label} card={card} slotIndex={i} />
                  })}
                </div>
              </div>

              {/* Selection hint — below the slot panel */}
              {selectionCount < MAX_SELECTIONS && (
                <p style={{
                  fontFamily:    'Raleway, sans-serif',
                  fontSize:      '16px',
                  color:         'rgba(255,248,220,0.95)',
                  textShadow:    '0 2px 8px rgba(0,0,0,0.6)',
                  letterSpacing: '0.05em',
                  margin:        0,
                  textAlign:     'center',
                  pointerEvents: 'none',
                }}>
                  {cameraEnabled
                    ? '👆 Point at a card to hover · 🤏 Pinch like you’re sizing something tiny to select'
                    : 'Click a card to select · Camera is off'}
                </p>
              )}
            </div>

            {/* Instruction pill */}
            <div style={{
              position: 'absolute', bottom: 'calc(48vh - 12px)',
              left: '50%', transform: 'translateX(-50%)', zIndex: 20, whiteSpace: 'nowrap',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              <motion.div
                key={selectionCount < MAX_SELECTIONS ? 'choosing' : 'reveal'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(20,10,40,0.55)', backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  padding: '9px 22px', borderRadius: '20px',
                  color: 'rgba(232,220,200,0.35)',
                  fontSize: '13px', fontFamily: 'Raleway, sans-serif', letterSpacing: '0.04em',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                {selectionCount === 0
                  ? 'Choose three cards to reveal your path'
                  : selectionCount < MAX_SELECTIONS
                  ? `${MAX_SELECTIONS - selectionCount} more card${MAX_SELECTIONS - selectionCount > 1 ? 's' : ''} to draw`
                  : 'Your cards are chosen'}
              </motion.div>

              {selectionCount === MAX_SELECTIONS && (
                <>
                  <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => startReadingFromSelection()}
                    className="btn-mystical-primary"
                    style={{ whiteSpace: 'nowrap', fontSize: '12px', padding: '11px 28px' }}
                  >
                    Reveal Reading
                  </motion.button>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                      fontFamily:    'Raleway, sans-serif',
                      fontSize:      '14px',
                      color:         'rgba(235,220,255,0.78)',
                      textShadow:    '0 1px 6px rgba(0,0,0,0.4)',
                      letterSpacing: '0.05em',
                      margin:        '6px 0 0',
                      textAlign:     'center',
                    }}
                  >
                    🤚 Open your palm to reveal
                  </motion.p>
                </>
              )}
            </div>

            {/* True rotational arc fan */}
            <CardFan
              ref={cardFanRef}
              deck={deck}
              selectedSet={selectedSet}
              onHoverChange={handleHoverChange}
              onCardClick={handleFanCardClick}
            />

          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ PHASE 5: READING ══════════ */}
      <AnimatePresence>
        {phase === 'reading' && readingData && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            ref={readingScrollRef}
            className="absolute inset-0 overflow-y-auto"
            style={{ paddingTop: 72, paddingBottom: 80 }}
          >
            {/* Ambient glow orbs */}
            <div className="bg-glow" style={{ top: '-10%', left: '-10%' }} />
            <div className="bg-glow" style={{ bottom: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(100,70,140,0.05) 0%, transparent 70%)' }} />

            <div style={{
              position: 'relative', zIndex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '0 32px', width: '100%', maxWidth: 960, margin: '0 auto',
            }}>
              {/* Question display */}
              {userQuestion && (
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div className="user-question-display">
                    &ldquo;{userQuestion}&rdquo;
                  </div>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24,
                marginTop: 20,
                width: '100%',
                alignItems: 'start',
              }}>
                {readingData.cards.map((cardData, i) => (
                  <ReadingCard
                    key={`${cardData.card.id}-${i}`}
                    cardData={cardData}
                    index={i}
                    revealed={cardsRevealed}
                  />
                ))}
              </div>

              <ReadingPanel
                whisper={reading?.whisper}
                isLoading={isLoading && !reading}
                onReset={reading ? handleReset : undefined}
                onWhisperRevealed={handleWhisperRevealed}
              />

              {/* Footer */}
              <div style={{ marginTop: 32, textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: '11px',
                  color: 'rgba(210,200,240,0.45)',
                  letterSpacing: '0.06em',
                }}>
                  © 2025 What Was Drawn
                </div>

                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 24,
                  }}
                >
                  <a
                    href="https://instagram.com/lifeofmooni"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      color: 'rgba(200, 185, 255, 0.65)',
                      textDecoration: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255, 248, 235, 0.9)'; e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200, 185, 255, 0.65)'; e.currentTarget.style.textDecoration = 'none' }}
                  >
                    @lifeofmooni
                  </a>

                  <a
                    href="https://ko-fi.com/lifeofmooni"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      color: 'rgba(200, 185, 255, 0.65)',
                      textDecoration: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255, 248, 235, 0.9)'; e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200, 185, 255, 0.65)'; e.currentTarget.style.textDecoration = 'none' }}
                  >
                    ☕ Ko-fi
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating scroll indicator (reading only) */}
      {phase === 'reading' && showScrollIndicator && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(30, 15, 60, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(180, 140, 255, 0.25)',
            borderRadius: 30,
            padding: '12px 8px',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              color: 'rgba(210, 185, 255, 0.6)',
              fontFamily: 'Inter, sans-serif',
              writingMode: 'vertical-rl',
            }}
          >
            SCROLL
          </span>
          <div style={{ width: 1, height: 40, background: 'rgba(180, 140, 255, 0.3)' }} />
          <span
            className="scroll-indicator-chevron"
            style={{
              fontSize: 18,
              color: 'rgba(255, 220, 120, 0.85)',
              lineHeight: 1,
            }}
          >
            ▾
          </span>
        </div>
      )}

      {/* ── Deck load error ── */}
      {phase === 'intro' && loadError && (
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          zIndex: 60, textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(212,175,55,0.6)', fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', marginBottom: 10 }}>
            {loadError}
          </p>
          <button onClick={retryLoadDeck} className="btn-mystical px-5 py-2 text-xs">Retry</button>
        </div>
      )}

      {/* ── Header: escape hatch on spread/loading/reading ── */}
      {['spread', 'loading', 'reading'].includes(phase) && (
        <header
          className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
          style={{ background: 'linear-gradient(to bottom, rgba(10,8,20,0.8) 0%, transparent 100%)' }}
        >
          {/* Question pill (spread phase only) */}
          {phase === 'spread' && userQuestion ? (
            <div style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontStyle: 'italic', fontSize: '14px',
              color: 'rgba(235,225,255,0.92)',
              background: 'rgba(212,175,108,0.06)',
              border: '1px solid rgba(212,175,108,0.1)',
              borderRadius: 16, padding: '5px 14px',
              maxWidth: 260, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              &ldquo;{userQuestion}&rdquo;
            </div>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <button onClick={handleReset} className="btn-mystical">
              Start Over
            </button>
            <p style={{
              margin: '6px 0 0', fontSize: '11px',
              color: 'rgba(210,195,255,0.65)',
              fontFamily: 'Raleway, sans-serif',
              textAlign: 'right',
            }}>
              👍👍 or two thumbs up
            </p>
          </div>
        </header>
      )}

      {/* ── Error toast ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
              zIndex: 60, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px',
              padding: '14px 22px', textAlign: 'center', minWidth: '260px',
            }}
          >
            <p style={{ color: 'rgba(240,100,100,0.85)', fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', margin: '0 0 8px' }}>
              {error}
            </p>
            <button
              onClick={handleReset}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(212,175,55,0.7)', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem',
              }}
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Soft gate (after 3 readings) ── */}
      {showSoftGate && !isPreview && (
        <SoftGate onSupport={handleSupportOracle} />
      )}

      {/* ── Camera safety notice (global) ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 9999,
          maxWidth: 220,
          fontSize: 11,
          lineHeight: 1.7,
          color: 'rgba(200, 185, 255, 0.65)',
          fontFamily: 'Inter, sans-serif',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: 12 }}>🔒</span>{' '}
        Your camera never leaves your device. No video is recorded, stored, or transmitted — ever. Gesture detection runs 100% locally in your browser.
      </div>

      {/* ── Camera toggle (global) ── */}
      <button
        type="button"
        onClick={() => setCameraEnabled(v => !v)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: 'rgba(20, 10, 45, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(180, 140, 255, 0.4)',
          borderRadius: 30,
          padding: '10px 18px',
          fontSize: 13,
          fontFamily: 'Raleway, sans-serif',
          color: 'rgba(220, 200, 255, 0.9)',
          cursor: 'pointer',
        }}
      >
        {cameraEnabled ? '📷 Camera on' : '📷 Camera off'}
      </button>

      {/* ── Webcam — 100×75, bottom right (hidden when camera off) ── */}
      {cameraEnabled && (
        <div style={{
          position: 'fixed', bottom: 72, right: 24, zIndex: 50,
          width: 100, height: 75, borderRadius: 10, overflow: 'hidden',
          border: '1px solid rgba(212,175,55,0.35)',
          boxShadow: '0 0 10px rgba(212,175,55,0.1)',
          opacity: phase === 'shuffle' ? 0 : 1,
          pointerEvents: phase === 'shuffle' ? 'none' : 'auto',
          transition: 'opacity 0.4s',
        }}>
          <WebcamFeed
            onGesture={handleGesture}
            onPointerMove={handlePointerMove}
            onBothPalmsOpen={handleBothPalmsOpen}
            isMinimized
          />
        </div>
      )}
    </div>
  )
}
