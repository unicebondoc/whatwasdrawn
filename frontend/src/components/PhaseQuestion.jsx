import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const MAX_CHARS = 200
const CHIPS = [
  'What should I focus on today?',
  'What am I not seeing clearly?',
  'What does my heart need?',
  "What's blocking my progress?",
]

// Track visit count to hide chips after 5th visit
function getVisitCount() {
  return parseInt(localStorage.getItem('qVisits') || '0')
}
function incrementVisitCount() {
  const c = getVisitCount() + 1
  localStorage.setItem('qVisits', c.toString())
  return c
}

// Minimal peace-sign SVG
function VictoryIcon() {
  const c = 'rgba(212,175,108,0.7)'
  return (
    <svg width="32" height="42" viewBox="0 0 44 58" fill="none">
      <path d="M8 40 C4 33 4 22 9 17 C12 13 16 15 16 21" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="16" y="8"  width="6" height="22" rx="3"    stroke={c} strokeWidth="1.5" transform="rotate(-5 19 19)"/>
      <rect x="22" y="6"  width="6" height="24" rx="3"    stroke={c} strokeWidth="1.5" transform="rotate(5 25 18)"/>
      <rect x="29" y="26" width="5.5" height="7.5" rx="2.75" stroke={c} strokeWidth="1.5"/>
      <rect x="35" y="28" width="4.5" height="6"   rx="2.25" stroke={c} strokeWidth="1.5"/>
      <path d="M16 28 L14 42 C12 50 16 56 22 56 L30 56 C36 56 40 50 38 42 L37 28"
        stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function PhaseQuestion({ onSubmit, onSkip, onQuestionChange, cameraEnabled = true }) {
  const [question, setQuestion]       = useState('')
  const [showChips, setShowChips]     = useState(false)

  useEffect(() => {
    const visits = incrementVisitCount()
    setShowChips(visits <= 5)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value.slice(0, MAX_CHARS)
    setQuestion(val)
    onQuestionChange?.(val)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(question.trim())
    }
  }

  const handleChip = (text) => {
    setQuestion(text)
    onQuestionChange?.(text)
  }

  const charCount = question.length
  const showCount = charCount >= 100
  const countColor = charCount >= 180 ? '#d4af6c' : 'rgba(232,220,200,0.15)'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      {/* Question prompt */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.65 }}
        style={{ textAlign: 'center', maxWidth: 560, marginBottom: 28 }}
      >
        <p style={{
          fontFamily:    'Cormorant Garamond, Georgia, serif',
          fontWeight:    400,
          fontSize:      'clamp(1.6rem, 3.5vw, 2rem)',
          color:         'rgba(255,248,235,1)',
          textShadow:    '0 2px 12px rgba(0,0,0,0.5)',
          margin:        0,
          letterSpacing: '0.02em',
          lineHeight:    1.4,
        }}>
          What question do you carry<br />into this reading?
        </p>
      </motion.div>

      {/* Textarea + char count */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.65 }}
        style={{ width: '100%', maxWidth: '520px', marginBottom: 16, position: 'relative' }}
      >
        <textarea
          value={question}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Breathe in. What has been weighing on you?"
          rows={3}
          autoFocus
          style={{
            width:                '100%',
            boxSizing:            'border-box',
            fontFamily:           'Cormorant Garamond, Georgia, serif',
            fontSize:             '17px',
            fontStyle:            question ? 'italic' : 'normal',
            color:                'rgba(255,248,235,0.95)',
            background:           'rgba(255,255,255,0.07)',
            backdropFilter:       'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border:               '1px solid rgba(255,255,255,0.2)',
            boxShadow:            '0 8px 32px rgba(0,0,0,0.4)',
            borderRadius:         '12px',
            padding:              '20px 24px',
            outline:              'none',
            resize:               'none',
            lineHeight:           1.7,
            letterSpacing:        '0.01em',
            transition:           'border-color 0.25s',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)' }}
        />
        {/* Character count */}
        {showCount && (
          <div style={{
            position: 'absolute', bottom: 10, right: 16,
            fontFamily: 'Raleway, sans-serif',
            fontSize: '11px',
            color: countColor,
            transition: 'color 0.3s',
            pointerEvents: 'none',
          }}>
            {charCount} / {MAX_CHARS}
          </div>
        )}
      </motion.div>

      {/* Suggestion chips */}
      {showChips && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
            justifyContent: 'center',
            maxWidth: 520, marginBottom: 28,
          }}
        >
          {CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => handleChip(chip)}
              className="chip-btn"
            >
              {chip}
            </button>
          ))}
        </motion.div>
      )}

      {!showChips && <div style={{ height: 28 }} />}

      {/* Gesture instruction */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.65 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
      >
        {cameraEnabled ? (
          <p style={{
            fontFamily:    'Raleway, sans-serif',
            fontSize:      '14px',
            color:         'rgba(235,220,255,0.78)',
            textShadow:    '0 1px 6px rgba(0,0,0,0.4)',
            letterSpacing: '0.05em',
            margin:        0,
            textAlign:     'center',
          }}>
            ✌️ Show a peace sign when your question is ready
          </p>
        ) : (
          <p style={{
            fontFamily:    'Raleway, sans-serif',
            fontSize:      '14px',
            color:         'rgba(235,220,255,0.78)',
            textShadow:    '0 1px 6px rgba(0,0,0,0.4)',
            letterSpacing: '0.05em',
            margin:        0,
            textAlign:     'center',
          }}>
            Click when ready
          </p>
        )}

        {/* Skip link */}
        <button
          onClick={() => onSkip()}
          style={{
            background:    'none',
            border:        'none',
            cursor:        'pointer',
            color:         'rgba(210,200,240,0.85)',
            fontFamily:    'Raleway, sans-serif',
            fontSize:      '12px',
            letterSpacing: '0.05em',
            padding:       '4px 0',
            transition:    'color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,248,235,0.95)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(210,200,240,0.85)' }}
        >
          Continue without a question
        </button>
      </motion.div>
    </motion.div>
  )
}
