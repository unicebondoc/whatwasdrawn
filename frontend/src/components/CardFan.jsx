import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'

// ── Constants (exported for DeckPile compatibility) ───────────────────────────
export const CARD_W        = 70
export const CARD_H        = 105
export const TOTAL_CARDS   = 44
export const ARC_DEG       = 120   // fan spans -60° to +60°

// Distance from pivot (screen bottom-center) to card center along card axis.
// Controls how high the fan sits above the bottom of the screen.
const ARC_LIFT  = 240

// Legacy exports — DeckPile still imports these; keep them working.
const GAP = 5
export const DESIGN_FAN_WIDTH = TOTAL_CARDS * CARD_W + (TOTAL_CARDS - 1) * GAP
export function computeCardPositions(containerWidth, containerHeight) {
  const ARC_USABLE = 0.92
  const usableWidth = containerWidth * ARC_USABLE
  const scale       = usableWidth / DESIGN_FAN_WIDTH
  const offsetX     = (containerWidth - usableWidth) / 2
  const peakY       = containerHeight * 0.30
  const ARC_DROP_PX = 80
  return Array.from({ length: TOTAL_CARDS }, (_, i) => {
    const norm     = (i - (TOTAL_CARDS - 1) / 2) / ((TOTAL_CARDS - 1) / 2)
    const x        = offsetX + (CARD_W / 2 + i * (CARD_W + GAP)) * scale
    const y        = peakY + ARC_DROP_PX * norm * norm
    const rotation = (norm * ARC_DEG) / 2
    return { x, y, rotation }
  })
}

/**
 * computeFanPositions — screen-space card positions for the NEW rotational fan.
 * Used by DeckPile to land shuffle animation in the right place.
 * Returns { x, y, rotation } where x/y are top-left screen coords,
 * rotation is around the card's CENTER (Framer Motion default).
 */
export function computeFanPositions(screenWidth, screenHeight) {
  // Pivot is at screen bottom-center
  const pivotX   = screenWidth / 2
  const pivotY   = screenHeight
  // Distance from pivot to card center (along the card's axis = ARC_LIFT + CARD_H/2)
  const radius   = ARC_LIFT + CARD_H / 2

  return Array.from({ length: TOTAL_CARDS }, (_, i) => {
    const norm     = (i - (TOTAL_CARDS - 1) / 2) / ((TOTAL_CARDS - 1) / 2)
    const angleDeg = (norm * ARC_DEG) / 2
    const angleRad = (angleDeg * Math.PI) / 180
    const cx       = pivotX + Math.sin(angleRad) * radius
    const cy       = pivotY - Math.cos(angleRad) * radius
    return { x: cx - CARD_W / 2, y: cy - CARD_H / 2, rotation: angleDeg }
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DWELL_MS       = 800
const DEBOUNCE_MS    = 90
const HYSTERESIS_DEG = 2.5

function indexToAngle(i) {
  const norm = (i - (TOTAL_CARDS - 1) / 2) / ((TOTAL_CARDS - 1) / 2)
  return (norm * ARC_DEG) / 2
}

function angleToIndex(angle) {
  const norm = angle / (ARC_DEG / 2)
  return Math.max(0, Math.min(TOTAL_CARDS - 1, Math.round(((norm + 1) / 2) * (TOTAL_CARDS - 1))))
}

// ── Dwell ring (conic-gradient mask technique) ────────────────────────────────
function DwellRing({ progress }) {
  if (progress <= 0) return null
  return (
    <div
      style={{
        position: 'absolute',
        inset: -5,
        borderRadius: 12,
        background: `conic-gradient(
          rgba(212,175,108,0.92) ${progress * 360}deg,
          rgba(212,175,108,0.10) ${progress * 360}deg
        )`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        padding: 3,
        pointerEvents: 'none',
        zIndex: 51,
        filter: progress > 0.15 ? 'drop-shadow(0 0 7px rgba(212,175,108,0.65))' : 'none',
      }}
    />
  )
}

// ── Single card in the fan ────────────────────────────────────────────────────
function CardInFan({ index, hoveredIndex, isSelected, dimFan, containerWidth, dwellProgress, onClick, onMouseEnter, onMouseLeave }) {
  const isHovered  = hoveredIndex === index
  const isNeighbor = hoveredIndex !== null && Math.abs(index - hoveredIndex) === 1

  // Base angle + adjacent spread
  let angleDeg = indexToAngle(index)
  if (hoveredIndex !== null) {
    if (index === hoveredIndex - 1) angleDeg -= 5
    if (index === hoveredIndex + 1) angleDeg += 5
  }

  const liftExtra = isHovered ? 62 : isNeighbor ? 8 : 0
  const scale     = isHovered ? 1.18 : isNeighbor ? 1.04 : 1
  const zIndex    = isHovered ? 50 : isNeighbor ? Math.max(1, index) : index + 1
  const opacity   = isSelected ? 0 : dimFan ? 0.22 : isHovered ? 1 : 0.82

  return (
    <div
      style={{
        position:        'absolute',
        left:            (containerWidth - CARD_W) / 2,
        bottom:          0,
        width:           CARD_W,
        height:          CARD_H,
        transformOrigin: 'bottom center',
        transform:       `rotate(${angleDeg}deg) translateY(-${ARC_LIFT + liftExtra}px) scale(${scale})`,
        transition:      'transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s',
        zIndex,
        opacity,
        cursor:          isSelected ? 'default' : 'pointer',
        pointerEvents:   isSelected ? 'none' : 'auto',
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Dwell ring */}
      {isHovered && <DwellRing progress={dwellProgress} />}

      {/* Hover glow border */}
      {isHovered && (
        <div style={{
          position:  'absolute', inset: 0, borderRadius: 9, pointerEvents: 'none',
          border:    '1px solid rgba(212,175,108,0.9)',
          boxShadow: '0 0 28px rgba(212,175,108,0.45), 0 0 60px rgba(212,175,108,0.15), 0 10px 28px rgba(0,0,0,0.6)',
        }} />
      )}

      {/* Neighbor subtle glow */}
      {isNeighbor && !isHovered && (
        <div style={{
          position:  'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none',
          border:    '1px solid rgba(212,175,108,0.3)',
          boxShadow: '0 0 10px rgba(212,175,108,0.1)',
        }} />
      )}

      <img
        src="/cards/card-back.png"
        alt=""
        draggable={false}
        style={{
          width:        '100%',
          height:       '100%',
          borderRadius: 8,
          objectFit:    'cover',
          display:      'block',
          boxShadow:    isHovered
            ? '0 12px 32px rgba(0,0,0,0.65)'
            : '0 2px 8px rgba(0,0,0,0.4)',
          border:     `1px solid ${isHovered ? 'rgba(212,175,108,0.6)' : 'rgba(212,175,108,0.15)'}`,
          transition: 'box-shadow 0.35s, border-color 0.35s',
        }}
      />
    </div>
  )
}

// ── Main CardFan component ────────────────────────────────────────────────────
const CardFan = forwardRef(function CardFan({
  deck,
  selectedSet,
  onHoverChange,
  onCardClick,
}, ref) {
  const containerRef   = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Hover state — driven by both mouse and gesture
  const [hoveredIndex, setHoveredIndex]     = useState(null)
  const [dwellProgress, setDwellProgress]   = useState(0)

  // Internal refs for imperative gesture tracking
  const smoothPosRef      = useRef(null)
  const candidateRef      = useRef({ index: null, since: 0 })
  const currentHoverRef   = useRef(null)
  const selectedSetRef    = useRef(selectedSet)
  const onHoverChangeRef  = useRef(onHoverChange)
  selectedSetRef.current  = selectedSet
  onHoverChangeRef.current = onHoverChange

  const dwellRafRef  = useRef(null)
  const dwellStartRef = useRef(0)

  // Source of current hover: 'mouse' | 'gesture' | null
  // Mouse hover takes priority — gesture can't override while mouse is over a card
  const hoverSourceRef = useRef(null)

  // ── Resize observer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setContainerWidth(el.getBoundingClientRect().width)
    })
    ro.observe(el)
    setContainerWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  // ── Dwell timer — resets whenever hovered card changes ─────────────────────
  useEffect(() => {
    cancelAnimationFrame(dwellRafRef.current)
    setDwellProgress(0)
    if (hoveredIndex === null) return
    dwellStartRef.current = Date.now()
    function tick() {
      const p = Math.min((Date.now() - dwellStartRef.current) / DWELL_MS, 1)
      setDwellProgress(p)
      if (p < 1) dwellRafRef.current = requestAnimationFrame(tick)
    }
    dwellRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(dwellRafRef.current)
  }, [hoveredIndex])

  // ── Internal hover update helper ────────────────────────────────────────────
  const applyHover = useCallback((newIndex, source) => {
    if (newIndex === currentHoverRef.current) return
    currentHoverRef.current  = newIndex
    hoverSourceRef.current   = newIndex === null ? null : source
    setHoveredIndex(newIndex)
    onHoverChangeRef.current?.(newIndex)
  }, [])

  // ── Mouse hover (per card) ──────────────────────────────────────────────────
  const handleMouseEnter = useCallback((index) => {
    if (selectedSetRef.current?.has(index)) return
    candidateRef.current = { index, since: 0 }  // bypass debounce for mouse
    applyHover(index, 'mouse')
  }, [applyHover])

  const handleMouseLeave = useCallback((index) => {
    if (currentHoverRef.current === index && hoverSourceRef.current === 'mouse') {
      applyHover(null, null)
    }
  }, [applyHover])

  // ── Imperative: called from App.jsx per MediaPipe frame ────────────────────
  useImperativeHandle(ref, () => ({
    updateFingerPos(rawPos) {
      // If mouse is currently hovering a card, gesture can't override
      if (hoverSourceRef.current === 'mouse') return

      if (!rawPos || !containerRef.current) {
        smoothPosRef.current    = null
        candidateRef.current    = { index: null, since: 0 }
        applyHover(null, null)
        return
      }

      // EMA smoothing to reduce jitter
      if (!smoothPosRef.current) {
        smoothPosRef.current = { x: rawPos.x, y: rawPos.y }
      } else {
        smoothPosRef.current.x = smoothPosRef.current.x * 0.7 + rawPos.x * 0.3
        smoothPosRef.current.y = smoothPosRef.current.y * 0.7 + rawPos.y * 0.3
      }
      const pos = smoothPosRef.current

      // Compute angle from fan pivot (bottom-center of container)
      const rect   = containerRef.current.getBoundingClientRect()
      const pivotX = rect.left + rect.width / 2
      const pivotY = rect.bottom
      const dx     = pos.x * window.innerWidth  - pivotX
      const dy     = pos.y * window.innerHeight - pivotY

      // Only process if finger is above the pivot (dy < 0) and within arc + margin
      let candidate = null
      if (dy < 0) {
        const fingerAngle = Math.atan2(dx, -dy) * (180 / Math.PI)
        if (Math.abs(fingerAngle) <= ARC_DEG / 2 + 8) {
          const idx = angleToIndex(fingerAngle)
          if (!selectedSetRef.current?.has(idx)) {
            // Hysteresis: stick to current card unless finger moves HYSTERESIS_DEG away
            if (currentHoverRef.current !== null) {
              const currentAngle = indexToAngle(currentHoverRef.current)
              if (Math.abs(fingerAngle - currentAngle) < HYSTERESIS_DEG) {
                candidate = currentHoverRef.current
              } else {
                candidate = idx
              }
            } else {
              candidate = idx
            }
          }
        }
      }

      // Debounce: candidate must be stable for DEBOUNCE_MS before registering
      const now = Date.now()
      if (candidate !== candidateRef.current.index) {
        candidateRef.current = { index: candidate, since: now }
      }

      const stabilized = (now - candidateRef.current.since >= DEBOUNCE_MS)
        ? candidate
        : currentHoverRef.current  // not yet stable — keep current

      applyHover(stabilized, 'gesture')
    },
  }), [applyHover])

  // ── Click handler ───────────────────────────────────────────────────────────
  const handleClick = useCallback((index) => {
    if (selectedSet?.has(index)) return
    onCardClick?.(index)
  }, [selectedSet, onCardClick])

  const dimFan = (selectedSet?.size ?? 0) >= 3

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left:     0,
        right:    0,
        bottom:   0,
        height:   '44vh',
        overflow: 'visible',
      }}
    >
      {containerWidth > 0 && Array.from({ length: TOTAL_CARDS }, (_, i) => (
        <CardInFan
          key={i}
          index={i}
          hoveredIndex={hoveredIndex}
          isSelected={selectedSet?.has(i) ?? false}
          dimFan={dimFan}
          containerWidth={containerWidth}
          dwellProgress={hoveredIndex === i ? dwellProgress : 0}
          onClick={() => handleClick(i)}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={() => handleMouseLeave(i)}
        />
      ))}
    </div>
  )
})

export default CardFan
