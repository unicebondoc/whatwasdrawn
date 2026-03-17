export default function VoiceQuestion({ value, onChange, disabled }) {
  return (
    <div style={{ width: '100%', maxWidth: '600px', padding: '0 24px' }}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="What question do you carry into this reading?"
        maxLength={200}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.05rem',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.92)',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '8px',
          padding: '12px 20px',
          outline: 'none',
          textAlign: 'center',
          letterSpacing: '0.01em',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={e => {
          if (disabled) return
          e.target.style.borderColor = 'rgba(212,175,55,0.85)'
          e.target.style.boxShadow = '0 0 20px rgba(212,175,55,0.2), 0 0 40px rgba(212,175,55,0.08)'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'rgba(212,175,55,0.3)'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}
