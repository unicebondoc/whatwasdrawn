import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaPipe } from '../hooks/useMediaPipe'

export default function WebcamFeed({ onGesture, onPointerMove, onBothPalmsOpen, isMinimized = false }) {
  const { videoRef, canvasRef, gesture, isReady, error, pointerPos } =
    useMediaPipe({ onGesture, onBothPalmsOpen })
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Fire on every frame with position AND current gesture together
  useEffect(() => {
    onPointerMove?.(pointerPos, gesture)
  }, [pointerPos, gesture, onPointerMove])

  useEffect(() => {
    if (error?.toLowerCase().includes('permission')) setPermissionDenied(true)
  }, [error])

  if (permissionDenied || error) {
    return (
      <div className={`relative overflow-hidden ${isMinimized ? 'w-full h-full' : 'rounded-2xl w-full max-w-sm aspect-video'}`}>
        <div className="absolute inset-0 glass-panel flex flex-col items-center justify-center p-4 text-center">
          <span className="text-2xl mb-2">🚫</span>
          <p className="text-oracle-cream/70 text-xs font-sans">
            {permissionDenied ? 'Camera access denied.' : 'Camera unavailable.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${isMinimized ? 'w-full h-full' : 'rounded-2xl w-full max-w-sm aspect-video'}`}>
      {/* Mirrored video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
        playsInline muted
      />

      {/* Landmark overlay (mirrored to match video) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        width={640} height={480}
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {!isReady && (
          <motion.div
            initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 glass-panel flex flex-col items-center justify-center gap-2"
          >
            <div className="w-6 h-6 border-2 border-mystic-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-oracle-cream/50 text-xs font-sans">Awakening…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner glow frame */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ border: '1px solid rgba(160,102,255,0.3)' }} />

      {/* Corner brackets */}
      {['top-0 left-0','top-0 right-0','bottom-0 left-0','bottom-0 right-0'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-3 h-3 pointer-events-none`}
          style={{
            borderColor: 'rgba(212,175,55,0.5)', borderStyle: 'solid',
            borderWidth: i===0?'2px 0 0 2px':i===1?'2px 2px 0 0':i===2?'0 0 2px 2px':'0 2px 2px 0',
          }} />
      ))}

      {/* Ready dot */}
      {isReady && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}

      {/* Gesture badge */}
      <AnimatePresence>
        {gesture && isReady && (
          <motion.div
            key={gesture}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-sans whitespace-nowrap"
            style={{
              background: 'rgba(13,10,26,0.85)',
              border: `1px solid ${gesture === 'pinch' ? 'rgba(212,175,55,0.5)' : 'rgba(160,102,255,0.4)'}`,
              color: gesture === 'pinch' ? '#d4af37' : '#a066ff',
              backdropFilter: 'blur(6px)',
            }}
          >
            {gesture === 'pinch' ? '🤏 grabbing' : gesture === 'point' ? '☝️ pointing' : gesture}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
