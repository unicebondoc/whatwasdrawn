import { motion } from 'framer-motion'
import OracleCard from './OracleCard'

/** Parse narrative into per-card insights and summary (Opening + Closing). */
export function parseReadingNarrative(narrative) {
  if (!narrative || typeof narrative !== 'string') return { cardInsights: [null, null, null], summary: '' }
  const paragraphs = narrative.split('\n\n').filter(Boolean)
  const cardInsights = [null, null, null]
  const summaryParts = []
  const positionHeads = [/^Past\s*—/i, /^Present\s*—/i, /^Future\s*—/i]
  for (const para of paragraphs) {
    let assigned = false
    for (let i = 0; i < 3; i++) {
      if (positionHeads[i].test(para)) {
        cardInsights[i] = para.replace(/^(?:Past|Present|Future)\s*—\s*[^:]+:\s*/i, '').trim() || para
        assigned = true
        break
      }
    }
    if (!assigned) {
      const cleaned = para.replace(/^(Opening|Closing whisper)\s*[:—-]\s*/i, '').trim()
      summaryParts.push(cleaned || para)
    }
  }
  return { cardInsights, summary: summaryParts.join('\n\n') }
}

export default function CardSpread({ reading, animateEntry = false, cardInsights = null, summary = '', onReset, compact = false }) {
  if (!reading) return null

  const { cards, spread_type } = reading
  const showInsights = compact && cardInsights && (cardInsights[0] || cardInsights[1] || cardInsights[2])

  return (
    <div className="w-full flex flex-col items-center" style={{ gap: showInsights ? 12 : 32 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <span className="text-oracle-cream/40 text-xs font-sans uppercase tracking-widest">
          {spread_type?.replace('_', ' ')} spread
        </span>
      </motion.div>

      {/* Cards row — with optional insight under each card */}
      <div
        className="flex items-start justify-center gap-8 flex-wrap"
        style={{ minHeight: showInsights ? 380 : 460 }}
      >
        {cards.map((cardData, i) => (
          <div
            key={`${cardData.card.id}-${i}`}
            className="flex flex-col items-center"
            style={{ maxWidth: showInsights ? 220 : 'none' }}
          >
            <OracleCard
              card={cardData.card}
              positionName={cardData.position_name}
              isReversed={cardData.is_reversed}
              index={i}
              isFlipped={!animateEntry}
              autoFlip={animateEntry}
              flipDelay={animateEntry ? i * 280 : 0}
              showPositionLabel={false}
              compact={showInsights}
            />
            {showInsights && cardInsights?.[i] && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.35 }}
                className="text-center mt-3 w-full px-2"
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '1.05rem',
                  color: 'rgba(251,244,219,0.98)',
                  lineHeight: 1.6,
                  whiteSpace: 'normal',
                  background: 'rgba(0,0,0,0.78)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  boxShadow: '0 8px 26px rgba(0,0,0,0.75)',
                }}
              >
                {cardInsights[i]}
              </motion.p>
            )}
          </div>
        ))}
      </div>

      {/* Summary (Opening + Closing) — compact one-page layout */}
      {showInsights && summary && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.35 }}
            className="w-full max-w-2xl mx-auto px-3"
            style={{
              background: 'rgba(0,0,0,0.82)',
              border: '1px solid rgba(212,175,55,0.35)',
              borderRadius: 14,
              padding: '18px 22px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.9)',
            }}
          >
            <div className="text-oracle-gold/60 text-xs font-sans uppercase tracking-widest mb-2 text-center">
              The Oracle Speaks
            </div>
            <p
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1rem',
                color: 'rgba(212,175,55,0.9)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {summary}
            </p>
          </motion.div>
          {onReset && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={onReset}
              className="btn-mystical text-xs mt-2"
            >
              Draw Again
            </motion.button>
          )}
        </>
      )}

      {/* Decorative line when not in compact insight mode */}
      {!showInsights && cards.length > 1 && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: cards.length * 0.25 + 0.5, duration: 0.8 }}
          className="flex items-center justify-center"
          style={{ width: '100%', maxWidth: '500px' }}
        >
          <div
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), rgba(160,102,255,0.3), transparent)',
            }}
          />
        </motion.div>
      )}
    </div>
  )
}
