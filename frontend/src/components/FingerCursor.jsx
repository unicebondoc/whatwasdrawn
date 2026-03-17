import { useRef, useEffect } from 'react'

const SIZE = 40   // wrapper px — larger to accommodate the progress ring
const CX   = SIZE / 2
const CY   = SIZE / 2
const R    = SIZE / 2 - 4  // arc radius

/**
 * Canvas-based finger cursor with pinch-progress ring.
 *
 * Props:
 *   posRef           — ref whose .current is { x, y } (0-1 normalised) or null
 *   pinchingRef      — ref whose .current is boolean
 *   pinchProgressRef — ref whose .current is 0-1 fill fraction for the ring
 */
export default function FingerCursor({ posRef, pinchingRef, pinchProgressRef }) {
  const wrapperRef = useRef(null)
  const canvasRef  = useRef(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas  = canvasRef.current
    if (!wrapper || !canvas) return
    const ctx = canvas.getContext('2d')

    let rafId

    const draw = () => {
      const pos = posRef.current

      if (!pos) {
        wrapper.style.opacity = '0'
        rafId = requestAnimationFrame(draw)
        return
      }

      // Position
      const sx = pos.x * window.innerWidth
      const sy = pos.y * window.innerHeight
      wrapper.style.transform = `translate(${sx - CX}px, ${sy - CY}px)`
      wrapper.style.opacity   = '1'

      const pinching = !!pinchingRef.current
      const progress = Math.min(1, Math.max(0, pinchProgressRef?.current ?? 0))

      // Clear
      ctx.clearRect(0, 0, SIZE, SIZE)

      // Track ring (always visible, faint)
      ctx.beginPath()
      ctx.arc(CX, CY, R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(212,175,55,0.18)'
      ctx.lineWidth   = 2.5
      ctx.stroke()

      // Progress arc (clockwise from top)
      if (progress > 0.01) {
        ctx.beginPath()
        ctx.arc(CX, CY, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
        ctx.strokeStyle = `rgba(212,175,55,${0.55 + progress * 0.4})`
        ctx.lineWidth   = 2.5
        ctx.lineCap     = 'round'
        ctx.stroke()
      }

      // Centre dot
      ctx.beginPath()
      ctx.arc(CX, CY, pinching ? 6 : 5, 0, Math.PI * 2)
      ctx.fillStyle = pinching ? 'rgba(212,175,55,0.95)' : 'rgba(255,255,255,0.88)'
      ctx.fill()

      // Glow
      wrapper.style.filter = pinching
        ? 'drop-shadow(0 0 8px rgba(212,175,55,0.85))'
        : 'drop-shadow(0 0 4px rgba(212,175,55,0.45))'

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [posRef, pinchingRef, pinchProgressRef])

  return (
    <div
      ref={wrapperRef}
      style={{
        position:      'fixed',
        top:           0,
        left:          0,
        width:         SIZE,
        height:        SIZE,
        pointerEvents: 'none',
        zIndex:        9999,
        opacity:       0,
        willChange:    'transform',
      }}
    >
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{ display: 'block' }}
      />
    </div>
  )
}
