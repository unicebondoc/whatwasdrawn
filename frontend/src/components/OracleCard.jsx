import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function OracleCard({
  card,
  positionName,
  isReversed = false,
  index = 0,
  isFlipped = false,
  autoFlip = false,
  flipDelay = 0,
  onFlip,
  showPositionLabel = true, // false in reading view to avoid duplicate "reveal" (card image only)
  compact = false, // smaller size for one-page reading layout
}) {
  const [showBack, setShowBack] = useState(autoFlip ? true : !isFlipped)
  const [expanded, setExpanded] = useState(false)

  // Staggered auto-flip for the reveal phase
  useEffect(() => {
    if (!autoFlip) return
    const t = setTimeout(() => {
      setShowBack(false)
      onFlip?.()
    }, flipDelay)
    return () => clearTimeout(t)
  }, [autoFlip, flipDelay, onFlip])

  const handleClick = () => {
    if (showBack) {
      setShowBack(false)
      onFlip?.()
    } else {
      setExpanded(e => !e)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateY: 90 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 0.7, delay: index * 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
    >
      {showPositionLabel && positionName && (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            color: 'rgba(212,212,220,0.5)',
            fontSize: '0.72rem',
            fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            {positionName}
          </span>
        </div>
      )}

      {/* Card — image only; card art itself carries the title */}
      <motion.div
        style={{
          width: compact ? 180 : 220,
          height: compact ? 288 : 352,
          perspective: '1000px',
          isolation: 'isolate',
          cursor: 'pointer',
        }}
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
      >
        <motion.div
          style={{
            position:       'relative',
            width:          '100%',
            height:         '100%',
            transformStyle: 'preserve-3d',
            transition:     'transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform:      showBack ? 'rotateY(0deg)' : isReversed ? 'rotateY(180deg) rotate(180deg)' : 'rotateY(180deg)',
          }}
        >
          {/* Back */}
          <div
            style={{
              position: 'absolute', inset: 0,
              borderRadius: '14px', overflow: 'hidden',
              backfaceVisibility: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <img src="/cards/card-back.png" alt="Card back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Front */}
          <div
            style={{
              position:           'absolute',
              inset:              0,
              borderRadius:       '14px',
              overflow:           'hidden',
              backfaceVisibility: 'hidden',
              transform:          'rotateY(180deg)',
              boxShadow:          '0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(212,175,55,0.12)',
            }}
          >
            <img
              src={`/cards/card-${card?.id}.png`}
              alt={card?.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4)',
              borderRadius: '14px',
              pointerEvents: 'none',
            }} />
          </div>
        </motion.div>
      </motion.div>

      {/* Expanded meaning on click (card image already shows title) */}
      {!showBack && expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(212,175,55,0.18)',
            borderRadius: '10px',
            padding: '12px 16px',
            maxWidth: '240px',
            textAlign: 'center',
          }}
        >
          <p style={{
            color:      'rgba(212,212,220,0.75)',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize:   '0.85rem',
            lineHeight: 1.6,
            margin:     0,
            fontStyle:  'italic',
          }}>
            {isReversed ? card?.shadow_aspect : card?.meaning}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
