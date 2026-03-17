import { motion } from 'framer-motion'

// ── Minimal palm SVG (small, inline use) ─────────────────────────────────────
function PalmIcon() {
  const c = 'rgba(212,175,108,0.5)'
  return (
    <svg width="16" height="20" viewBox="0 0 52 68" fill="none" aria-hidden="true">
      <path d="M9 46 C5 38 5 26 10 20 C13 16 17 18 17 24" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <rect x="17" y="9" width="6.5" height="23" rx="3.25" stroke={c} strokeWidth="2" />
      <rect x="24" y="6" width="6.5" height="26" rx="3.25" stroke={c} strokeWidth="2" />
      <rect x="31" y="8" width="6.5" height="24" rx="3.25" stroke={c} strokeWidth="2" />
      <rect x="38" y="13" width="6" height="19" rx="3" stroke={c} strokeWidth="2" />
      <path d="M17 30 L15 50 C13 60 18 66 24 66 L38 66 C44 66 48 60 46 50 L45 30"
        stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Large palm SVG for the main CTA ──────────────────────────────────────────
function LargePalmIcon() {
  const c = 'rgba(212,175,108,0.75)'
  return (
    <svg width="28" height="34" viewBox="0 0 52 68" fill="none" aria-hidden="true">
      <path d="M9 46 C5 38 5 26 10 20 C13 16 17 18 17 24" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="17" y="9" width="6.5" height="23" rx="3.25" stroke={c} strokeWidth="1.8" />
      <rect x="24" y="6" width="6.5" height="26" rx="3.25" stroke={c} strokeWidth="1.8" />
      <rect x="31" y="8" width="6.5" height="24" rx="3.25" stroke={c} strokeWidth="1.8" />
      <rect x="38" y="13" width="6" height="19" rx="3" stroke={c} strokeWidth="1.8" />
      <path d="M17 30 L15 50 C13 60 18 66 24 66 L38 66 C44 66 48 60 46 50 L45 30"
        stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Floating mote of light ───────────────────────────────────────────────────
function Mote({ x, y, size, delay, duration }) {
  return (
    <motion.div
      animate={{ opacity: [0, 0.6, 0], y: [0, -28, 0], x: [0, (Math.random() - 0.5) * 10, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute', left: x, top: y,
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(248,226,176,0.85)',
        boxShadow: '0 0 5px rgba(248,226,176,0.5)',
        pointerEvents: 'none',
      }}
    />
  )
}

// ── Three-card hero spread ───────────────────────────────────────────────────
function CardSpreadHero() {
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      height: 210,
      width: '100%',
      maxWidth: 340,
    }}>
      {/* Ambient ground glow */}
      <motion.div
        animate={{ opacity: [0.2, 0.45, 0.2], scaleX: [0.9, 1.1, 0.9] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: -8, left: '50%',
          width: 260, height: 48,
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(212,175,108,0.18) 0%, rgba(100,70,140,0.08) 55%, transparent 72%)',
          filter: 'blur(16px)',
          pointerEvents: 'none',
        }}
      />

      {/* Left card — face down, angled */}
      <motion.div
        initial={{ opacity: 0, y: 36, rotate: -22 }}
        animate={{ opacity: 1, y: 0, rotate: -18 }}
        transition={{ delay: 0.22, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 82, height: 123, flexShrink: 0, zIndex: 1,
          transformOrigin: 'bottom center',
          marginRight: -22,
        }}
      >
        <img
          src="/cards/card-back.png" alt="" draggable={false}
          style={{
            width: '100%', height: '100%',
            borderRadius: 10, objectFit: 'cover', display: 'block',
            boxShadow: '0 14px 40px rgba(0,0,0,0.72)',
            border: '1px solid rgba(212,175,108,0.1)',
          }}
        />
      </motion.div>

      {/* Center card — cover, floating */}
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 3, flexShrink: 0 }}
      >
        {/* Card glow halo */}
        <motion.div
          animate={{ opacity: [0.35, 0.65, 0.35], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -18, borderRadius: 22,
            background: 'radial-gradient(circle, rgba(212,175,108,0.18) 0%, rgba(100,70,140,0.1) 55%, transparent 72%)',
            filter: 'blur(12px)',
            pointerEvents: 'none',
          }}
        />

        {/* Floating bob */}
        <motion.div
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img
            src="/cards/cover.png" alt="The Quiet Whiskers Oracle" draggable={false}
            style={{
              width: 114, height: 171,
              borderRadius: 14, objectFit: 'cover', display: 'block',
              boxShadow: '0 22px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,108,0.12)',
              border: '1px solid rgba(212,175,108,0.25)',
            }}
          />
        </motion.div>

        {/* Floating motes around center card */}
        <Mote x="8%"  y="12%" size={3} delay={0.4}  duration={3.2} />
        <Mote x="78%" y="22%" size={2} delay={1.6}  duration={4.0} />
        <Mote x="20%" y="70%" size={2} delay={2.8}  duration={3.6} />
      </motion.div>

      {/* Right card — face down, angled */}
      <motion.div
        initial={{ opacity: 0, y: 36, rotate: 22 }}
        animate={{ opacity: 1, y: 0, rotate: 18 }}
        transition={{ delay: 0.22, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 82, height: 123, flexShrink: 0, zIndex: 1,
          transformOrigin: 'bottom center',
          marginLeft: -22,
        }}
      >
        <img
          src="/cards/card-back.png" alt="" draggable={false}
          style={{
            width: '100%', height: '100%',
            borderRadius: 10, objectFit: 'cover', display: 'block',
            boxShadow: '0 14px 40px rgba(0,0,0,0.72)',
            border: '1px solid rgba(212,175,108,0.1)',
          }}
        />
      </motion.div>
    </div>
  )
}

// ── Main landing ─────────────────────────────────────────────────────────────
export default function PhaseIntro({ onBegin }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.55 } }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
        overflow: 'hidden',
      }}
    >
      {/* Background radial atmosphere */}
      <motion.div
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-10%', left: '50%',
          width: 'min(800px, 140vw)', height: 'min(700px, 120vw)',
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(80,55,120,0.12) 0%, rgba(50,35,90,0.07) 40%, transparent 68%)',
          filter: 'blur(48px)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Content column ── */}
      <div style={{
        position: 'relative', zIndex: 3,
        width: '100%', maxWidth: 440,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 0,
      }}>

        {/* 1 ── Spread tag (barely visible) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.0, duration: 0.8 }}
          style={{
            marginBottom: 28,
            color: 'rgba(210,200,240,0.85)',
            fontFamily: 'Raleway, sans-serif',
            fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase',
          }}
        >
          Three card reflection
        </motion.div>

        {/* 2 ── Card spread hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.04, duration: 0.5 }}
          style={{ marginBottom: 30, width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <CardSpreadHero />
        </motion.div>

        {/* 3 ── Title */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          style={{
            margin: '0 0 10px',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontWeight: 400,
            fontSize: 'clamp(2.4rem, 9vw, 3rem)',
            lineHeight: 1.05,
            letterSpacing: '0.02em',
            color: 'rgba(255,248,235,1)',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            textAlign: 'center',
            textWrap: 'balance',
          }}
        >
          The Quiet Whiskers Oracle
        </motion.h1>

        {/* 4 ── Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.68, duration: 0.7 }}
          style={{
            margin: '0 0 20px',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '17px',
            color: 'rgba(235,225,255,0.92)',
            textAlign: 'center',
            letterSpacing: '0.01em',
            lineHeight: 1.45,
          }}
        >
          Quiet messages for the moments in between.
        </motion.p>


        {/* 6 ── Palm CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.88, duration: 0.65 }}
        >
          <motion.button
            type="button"
            onClick={onBegin}
            whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              display:              'flex',
              flexDirection:        'row',
              alignItems:           'center',
              gap:                  12,
              background:           'rgba(20,10,40,0.55)',
              backdropFilter:       'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border:               '1px solid rgba(255,255,255,0.2)',
              borderRadius:         '40px',
              padding:              '14px 28px 14px 20px',
              boxShadow:            '0 8px 32px rgba(0,0,0,0.4)',
              cursor:               'pointer',
            }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}
            >
              <LargePalmIcon />
            </motion.div>
            <span style={{
              fontFamily:    'Raleway, sans-serif',
              fontSize:      '14px',
              fontWeight:    500,
              color:         'rgba(235,220,255,0.78)',
              letterSpacing: '0.05em',
              textShadow:    '0 1px 6px rgba(0,0,0,0.4)',
            }}>
              Open your palm to begin
            </span>
          </motion.button>
        </motion.div>

        {/* Camera safety notice */}
        <div
          style={{
            maxWidth: 340,
            marginTop: 16,
            textAlign: 'center',
            fontSize: 12,
            lineHeight: 1.7,
            color: 'rgba(200, 185, 255, 0.65)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <span style={{ fontSize: 14 }}>🔒</span>{' '}
          Your camera never leaves your device.
          <br />
          No video is recorded, stored, or transmitted —<br />
          ever. Gesture detection runs 100% locally
          <br />
          in your browser.
        </div>

      </div>
    </motion.div>
  )
}
