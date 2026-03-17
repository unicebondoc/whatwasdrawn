import { motion } from 'framer-motion'

const GESTURES = [
  { icon: '✋', name: 'Open Palm', action: 'Start shuffle · Or reveal 3 chosen cards' },
  { icon: '✌️', name: 'Peace / Victory', action: 'Send your question when you are ready' },
  { icon: '👍👍', name: 'Two thumbs up', action: 'Re-shuffle the deck · Or begin again (spread/reading)' },
  { icon: '🤏', name: 'Pinch / Tap', action: 'Tap shuffle button or select a card' },
  { icon: '☝️', name: 'Point', action: 'Single card reading' },
]

export default function GestureGuide({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,10,26,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-panel p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-2xl text-oracle-gold text-center mb-2">
          Gesture Guide
        </h2>
        <p className="text-oracle-cream/50 text-sm text-center mb-6 font-sans">
          Hold each gesture steady for 1–2 seconds to activate
        </p>

        <div className="space-y-3">
          {GESTURES.map((g, i) => (
            <motion.div
              key={g.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 p-3 rounded-xl"
              style={{ background: 'rgba(160,102,255,0.06)', border: '1px solid rgba(160,102,255,0.15)' }}
            >
              <span className="text-3xl">{g.icon}</span>
              <div>
                <div className="text-oracle-cream font-medium text-sm">{g.name}</div>
                <div className="text-oracle-cream/50 text-xs font-sans">{g.action}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-3 rounded-xl text-center"
          style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <p className="text-oracle-cream/60 text-xs font-sans">
            No camera? Use the <strong className="text-oracle-gold">Draw Cards</strong> button below the webcam feed.
          </p>
        </div>

        <button onClick={onClose} className="btn-mystical w-full mt-6 text-xs">
          Close
        </button>
      </motion.div>
    </motion.div>
  )
}
