import { motion } from 'framer-motion'

const PHASE_MESSAGES = {
  drawing: [
    'The oracle reaches into the veil...',
    'Cards are being drawn...',
    'The deck stirs in the moonlight...',
  ],
  reading: [
    'The Quiet Whiskers Oracle contemplates...',
    'Weaving your reading from the stars...',
    'Ancient wisdom surfaces...',
  ],
}

export default function LoadingOracle({ phase }) {
  const messages = PHASE_MESSAGES[phase] || PHASE_MESSAGES.drawing
  const message = messages[Math.floor(Date.now() / 1000) % messages.length]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-6 py-16"
    >
      {/* Animated cat glyph */}
      <motion.div
        animate={{
          y: [0, -12, 0],
          filter: [
            'drop-shadow(0 0 8px rgba(160,102,255,0.4))',
            'drop-shadow(0 0 20px rgba(160,102,255,0.8))',
            'drop-shadow(0 0 8px rgba(160,102,255,0.4))',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="text-6xl select-none"
      >
        🐈
      </motion.div>

      {/* Orbiting dots */}
      <div className="relative w-16 h-16">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i === 0 ? '#a066ff' : i === 1 ? '#d4af37' : '#60a5fa',
              top: '50%',
              left: '50%',
            }}
            animate={{
              x: Math.cos((i * 2 * Math.PI) / 3) * 24,
              y: Math.sin((i * 2 * Math.PI) / 3) * 24,
              rotate: 360,
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Phase message */}
      <motion.p
        key={message}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-oracle-cream/60 text-sm font-mystical italic text-center max-w-xs"
        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
      >
        {message}
      </motion.p>
    </motion.div>
  )
}
