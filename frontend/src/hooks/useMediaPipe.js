import { useEffect, useRef, useState, useCallback } from 'react'

export function useMediaPipe({ onGesture, onBothPalmsOpen } = {}) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const handsRef  = useRef(null)
  const rafIdRef  = useRef(null)   // replaces Camera class (works on mobile)

  // Refs so the camera loop always calls latest callbacks without re-initing (avoids restart on phase change)
  const onGestureRef       = useRef(onGesture)
  const onBothPalmsOpenRef = useRef(onBothPalmsOpen)
  onGestureRef.current       = onGesture
  onBothPalmsOpenRef.current  = onBothPalmsOpen

  // Track previous gesture so onGesture fires only on first frame of a new gesture
  const prevGestureRef     = useRef(null)
  const prevBothPalmsRef   = useRef(false)
  const prevBothThumbsRef  = useRef(false)
  const lastBothThumbsAtRef = useRef(0)
  const BOTH_THUMBS_DEBOUNCE_MS = 1100

  const [gesture,    setGesture]    = useState(null)
  const [landmarks,  setLandmarks]  = useState(null)
  const [isReady,    setIsReady]    = useState(false)
  const [error,      setError]      = useState(null)
  // Normalized (0–1) index finger tip; x already mirrored to match screen
  const [pointerPos, setPointerPos] = useState(null)

  // ── Gesture classifier ────────────────────────────────────────────────────
  const classifyGesture = useCallback((lm) => {
    if (!lm || lm.length < 21) return null

    const thumbTip  = lm[4];  const indexTip  = lm[8]
    const middleTip = lm[12]; const ringTip   = lm[16]; const pinkyTip = lm[20]
    const indexMCP  = lm[5];  const middleMCP = lm[9]
    const ringMCP   = lm[13]; const pinkyMCP  = lm[17]

    const ext = (tip, mcp) => tip.y < mcp.y - 0.03
    const extStrict = (tip, mcp) => tip.y < mcp.y - 0.05
    const indexExt  = ext(indexTip,  indexMCP)
    const middleExt = ext(middleTip, middleMCP)
    const ringExt   = ext(ringTip,   ringMCP)
    const pinkyExt  = ext(pinkyTip,  pinkyMCP)
    const allStrict = extStrict(indexTip, indexMCP) && extStrict(middleTip, middleMCP) &&
      extStrict(ringTip, ringMCP) && extStrict(pinkyTip, pinkyMCP)

    const dist3d = (a, b) =>
      Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2)
    const dist2d = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

    // Check pinch FIRST so it wins when thumb+index are close (easier to detect)
    const pinchDist3d = dist3d(thumbTip, indexTip)
    const pinchDist2d = dist2d(thumbTip, indexTip)
    if (pinchDist3d < 0.10 || pinchDist2d < 0.06) return 'pinch'

    // Thumbs up: thumb up, other fingers curled (only when not pinching)
    const thumbUp = lm[4].y < lm[3].y && lm[3].y < lm[2].y
    const fingersCurled = lm[8].y > lm[6].y && lm[12].y > lm[10].y &&
                          lm[16].y > lm[14].y && lm[20].y > lm[18].y
    if (thumbUp && fingersCurled) return 'thumbs_up'
    if (allStrict) return 'open_palm'
    if (indexExt && !middleExt && !ringExt && !pinkyExt) return 'point'
    if (indexExt && middleExt && !ringExt && !pinkyExt)  return 'victory'
    if (!indexExt && !middleExt && !ringExt && !pinkyExt) return 'fist'
    return null
  }, [])

  // ── Landmark skeleton drawing ─────────────────────────────────────────────
  const drawLandmarks = useCallback((lm, ctx, w, h) => {
    const CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ]

    ctx.strokeStyle = 'rgba(160,102,255,0.45)'
    ctx.lineWidth   = 1.5
    ctx.shadowColor = 'rgba(160,102,255,0.6)'
    ctx.shadowBlur  = 3
    for (const [a, b] of CONNECTIONS) {
      ctx.beginPath()
      ctx.moveTo(lm[a].x * w, lm[a].y * h)
      ctx.lineTo(lm[b].x * w, lm[b].y * h)
      ctx.stroke()
    }

    for (let i = 0; i < lm.length; i++) {
      const isTip = [4, 8, 12, 16, 20].includes(i)
      ctx.beginPath()
      ctx.arc(lm[i].x * w, lm[i].y * h, isTip ? 4 : 2.5, 0, Math.PI * 2)
      ctx.fillStyle   = isTip ? 'rgba(212,175,55,0.9)' : 'rgba(160,102,255,0.8)'
      ctx.shadowColor = isTip ? 'rgba(212,175,55,1)'   : 'rgba(160,102,255,1)'
      ctx.shadowBlur  = isTip ? 8 : 5
      ctx.fill()
    }
    ctx.shadowBlur = 0
  }, [])

  // ── Per-frame result handler ──────────────────────────────────────────────
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const allHands = results.multiHandLandmarks ?? []

    if (allHands.length > 0) {
      // Primary hand (index 0) drives pointer + single-hand gestures
      const lm = allHands[0]
      setLandmarks(lm)
      drawLandmarks(lm, ctx, canvas.width, canvas.height)

      // Mirror x so it matches the flipped video display
      setPointerPos({ x: 1 - lm[8].x, y: lm[8].y })

      const now = Date.now()
      const bothThumbsUp = allHands.length >= 2 &&
        allHands.every(h => classifyGesture(h) === 'thumbs_up')
      if (bothThumbsUp && !prevBothThumbsRef.current && (now - lastBothThumbsAtRef.current) > BOTH_THUMBS_DEBOUNCE_MS) {
        prevBothThumbsRef.current = true
        lastBothThumbsAtRef.current = now
        onGestureRef.current?.('both_thumbs_up')
      } else if (!bothThumbsUp) {
        prevBothThumbsRef.current = false
      }

      const detected = classifyGesture(lm)
      setGesture(detected)

      // Fire onGesture once per gesture-start (not every frame); skip single thumbs_up when both thumbs up
      if (!bothThumbsUp && detected !== prevGestureRef.current) {
        prevGestureRef.current = detected
        if (detected) onGestureRef.current?.(detected)
      } else if (bothThumbsUp) {
        prevGestureRef.current = 'thumbs_up' // avoid re-firing single when releasing one hand
      }

      // Both-palms detection — fires once when both hands show open_palm
      const bothOpen = allHands.length >= 2 &&
        allHands.every(h => classifyGesture(h) === 'open_palm')
      if (bothOpen && !prevBothPalmsRef.current) {
        prevBothPalmsRef.current = true
        onBothPalmsOpenRef.current?.()
      } else if (!bothOpen) {
        prevBothPalmsRef.current = false
      }
    } else {
      setLandmarks(null)
      setGesture(null)
      setPointerPos(null)
      prevBothThumbsRef.current = false
      prevBothPalmsRef.current = false
      if (prevGestureRef.current !== null) {
        prevGestureRef.current = null
        onGestureRef.current?.(null)   // signal gesture ended
      }
    }
  }, [classifyGesture, drawLandmarks])

  // ── Init MediaPipe ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Only import Hands — skip Camera utility (broken on mobile Safari)
        const { Hands } = await import('@mediapipe/hands')
        if (cancelled) return

        // Lower model complexity on mobile for performance
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

        const hands = new Hands({
          locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        })
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: isMobile ? 0 : 1,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.5,
        })
        hands.onResults(onResults)
        handsRef.current = hands

        // Use ideal constraints — avoids rejection on mobile devices
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width:  { ideal: 640 },
            height: { ideal: 480 },
          },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        // playsInline + muted already set in JSX; play() resolves on mobile when muted
        await video.play()

        // Custom RAF loop — replaces @mediapipe/camera_utils which stalls on mobile
        const processFrame = async () => {
          if (cancelled) return
          if (handsRef.current && video.readyState >= 2) {
            try {
              await handsRef.current.send({ image: video })
            } catch (_) {
              // ignore frame errors (e.g. during tab switch on mobile)
            }
          }
          rafIdRef.current = requestAnimationFrame(processFrame)
        }
        rafIdRef.current = requestAnimationFrame(processFrame)

        if (!cancelled) setIsReady(true)
      } catch (err) {
        if (!cancelled) {
          console.error('MediaPipe init error:', err)
          setError(err.message || 'Failed to access camera or load gesture model.')
        }
      }
    }

    init()
    return () => {
      cancelled = true
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      handsRef.current?.close()
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
    }
  }, [onResults])

  return { videoRef, canvasRef, gesture, landmarks, isReady, error, pointerPos }
}
