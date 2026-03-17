import { forwardRef, useImperativeHandle, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { computeFanPositions, CARD_W, CARD_H } from './CardFan'

const TOTAL_CARDS = 44

// ── Web Audio whoosh ──────────────────────────────────────────────────────────
function playWhoosh() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const dur = 0.9
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      const t   = i / data.length
      const env = t < 0.12 ? t / 0.12 : Math.exp(-3.5 * (t - 0.12))
      data[i]   = (Math.random() * 2 - 1) * env * 0.45
    }
    const source = ctx.createBufferSource()
    source.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 0.6
    filter.frequency.setValueAtTime(1400, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + dur)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.85, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    source.stop(ctx.currentTime + dur)
    source.onended = () => ctx.close()
  } catch (e) {
    console.warn('Audio unavailable:', e)
  }
}

// ── Stable per-card random data (computed once) ───────────────────────────────
function makeRng() {
  return Array.from({ length: TOTAL_CARDS }, () => ({
    pjx:       (Math.random() - 0.5) * 8,
    pjy:       (Math.random() - 0.5) * 8,
    pjr:       (Math.random() - 0.5) * 9,
    // Burst angle in [0, π]: right → down → left — never upward
    bAngle:    Math.random() * Math.PI,
    bDistFrac: 0.22 + Math.random() * 0.28,
    bRot:      (Math.random() - 0.5) * 70,
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────
const DeckPile = forwardRef(function DeckPile({ onShuffleComplete, autoStart = false }, ref) {
  const [animPhase, setAnimPhase] = useState('pile')
  const [size, setSize]           = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const rngRef                    = useRef(null)
  const timeoutsRef               = useRef([])
  const triggerShuffleRef         = useRef(null)

  if (!rngRef.current) rngRef.current = makeRng()

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const positions = useMemo(() => {
    const { w, h } = size
    const cx = w / 2
    const cy = h * 0.44

    const fan = computeFanPositions(w, h)
    const dim = Math.min(w, h)

    // Cap burst y so cards settle downward, never fly off the top
    const maxBurstY = h * 0.55

    return rngRef.current.map((rng, i) => ({
      pile: {
        x:      cx - CARD_W / 2 + rng.pjx,
        y:      cy - CARD_H / 2 + rng.pjy,
        rotate: rng.pjr,
      },
      burst: {
        x:      cx + Math.cos(rng.bAngle) * rng.bDistFrac * dim - CARD_W / 2,
        y:      Math.min(cy + Math.sin(rng.bAngle) * rng.bDistFrac * dim, maxBurstY) - CARD_H / 2,
        rotate: rng.bRot,
      },
      fan: {
        x:      fan[i].x,
        y:      fan[i].y,
        rotate: fan[i].rotation,
      },
    }))
  }, [size])

  const triggerShuffle = useCallback(() => {
    if (animPhase !== 'pile') return
    playWhoosh()
    setAnimPhase('burst')

    const completedRef = { fired: false }
    const complete = () => {
      if (completedRef.fired) return
      completedRef.fired = true
      onShuffleComplete?.()
    }
    const t1 = setTimeout(() => setAnimPhase('fan'), 900)
    const t2 = setTimeout(complete, 2400)
    const t3 = setTimeout(complete, 3400)
    timeoutsRef.current = [t1, t2, t3]
  }, [animPhase, onShuffleComplete])

  // Keep ref in sync so autoStart effect always calls the latest version
  triggerShuffleRef.current = triggerShuffle

  useImperativeHandle(ref, () => ({ shuffle: triggerShuffle }), [triggerShuffle])

  // Auto-trigger shuffle on mount when autoStart is true
  useEffect(() => {
    if (!autoStart) return
    const t = setTimeout(() => triggerShuffleRef.current?.(), 200)
    return () => clearTimeout(t)
  }, [autoStart]) // intentionally omits triggerShuffle — uses ref above

  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), [])

  const cardTarget = (i) => {
    const pos = positions[i]
    if (animPhase === 'pile')  return { x: pos.pile.x,  y: pos.pile.y,  rotate: pos.pile.rotate  }
    if (animPhase === 'burst') return { x: pos.burst.x, y: pos.burst.y, rotate: pos.burst.rotate }
    return                            { x: pos.fan.x,   y: pos.fan.y,   rotate: pos.fan.rotate   }
  }

  const cardTransition = (i) => {
    if (animPhase === 'pile')  return { duration: 0 }
    if (animPhase === 'burst') return { type: 'spring', stiffness: 280, damping: 22, delay: i * 0.004 }
    // Fan: spring settle — falls into position
    return { type: 'spring', stiffness: 40, damping: 20, delay: i * 0.012 }
  }

  return (
    <div className="absolute inset-0">
      {/* Cards */}
      {positions.map((_, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', width: CARD_W, height: CARD_H, zIndex: i }}
          animate={cardTarget(i)}
          transition={cardTransition(i)}
        >
          <img
            src="/cards/card-back.png"
            alt=""
            draggable={false}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
              borderRadius: '6px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.55)',
            }}
          />
        </motion.div>
      ))}

      {/* Shuffling text — burst/fan phases */}
      <AnimatePresence>
        {animPhase !== 'pile' && (
          <motion.div
            key="shuffling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', zIndex: 100,
            }}
          >
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                marginTop:     '30vh',
                color:         'rgba(212,175,55,0.85)',
                fontFamily:    'var(--font-sans, sans-serif)',
                fontSize:      '0.9rem',
                letterSpacing: '0.08em',
                textAlign:     'center',
              }}
            >
              Shuffling the deck…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default DeckPile
