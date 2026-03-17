import { motion } from 'framer-motion'

export default function ReadingNarrative({ narrative, onReset }) {
  if (!narrative) return null

  // Split into paragraphs for staggered reveal
  const paragraphs = narrative.split('\n\n').filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-oracle-gold/60 text-xs font-sans uppercase tracking-widest mb-2">
          The Oracle Speaks
        </div>
        <div
          className="h-px w-24 mx-auto"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }}
        />
      </div>

      {/* Narrative */}
      <div
        style={{
          background: 'rgba(0,0,0,0.70)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(212,175,55,0.18)',
          borderRadius: '16px',
          padding: '32px',
        }}
      >
        <div className="space-y-4">
          {paragraphs.map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1.05rem',
                color: 'rgba(212,175,55,0.88)',
                lineHeight: 1.75,
              }}
            >
              {para}
            </motion.p>
          ))}
        </div>

        {/* Closing ornament */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 + paragraphs.length * 0.08 + 0.2 }}
          className="mt-6 text-center text-lg"
          style={{ color: 'rgba(212,175,55,0.4)' }}
        >
          ✦ ✦ ✦
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 + paragraphs.length * 0.08 }}
        className="flex justify-center gap-4 mt-6"
      >
        <button
          onClick={onReset}
          className="btn-mystical text-xs"
        >
          Draw Again
        </button>
      </motion.div>
    </motion.div>
  )
}
