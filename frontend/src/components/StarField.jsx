import { useMemo } from 'react'

export default function StarField({ count = 80 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top:  `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        duration: Math.random() * 4 + 2,
        delay: Math.random() * 5,
      })),
    [count],
  )

  return (
    <div className="star-bg" aria-hidden>
      {/* 1. Background image with filter */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.85) saturate(0.9)',
      }} />

      {/* 2. Darkening/vignette overlay — above image, below content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(20,10,40,0.55) 0%, rgba(30,15,60,0.35) 50%, rgba(20,10,40,0.55) 100%)',
        pointerEvents: 'none',
      }} />

      {/* 3. Stars */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.3, zIndex: 2 }}>
        {stars.map((star) => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.8)',
              opacity: star.opacity,
              animation: `glow-pulse ${star.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* 4. Nebula glow blobs */}
      <div style={{
        position: 'absolute', zIndex: 2,
        top: '20%', left: '10%',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(128,64,255,0.07) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', zIndex: 2,
        bottom: '10%', right: '5%',
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,108,0.04) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
