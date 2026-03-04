const ComingSoon = () => (
  <div style={{
    minHeight: '100vh',
    background: '#0f1117',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Georgia', serif",
    color: '#e2e8f0',
    padding: '2rem',
    textAlign: 'center',
  }}>
    <div style={{
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 26,
      marginBottom: '2rem',
      boxShadow: '0 0 32px rgba(99,102,241,0.4)',
    }}>
      ◎
    </div>
    <h1 style={{
      fontSize: 'clamp(2rem, 5vw, 3.5rem)',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      margin: '0 0 1rem',
      background: 'linear-gradient(90deg, #e2e8f0, #94a3b8)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }}>
      AgoraShell
    </h1>
    <p style={{
      fontSize: '1.1rem',
      color: '#64748b',
      maxWidth: 400,
      lineHeight: 1.6,
      margin: '0 0 3rem',
    }}>
      Estamos preparando algo. Vuelve pronto.
    </p>
    <div style={{
      width: 48,
      height: 2,
      background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
      borderRadius: 2,
    }} />
  </div>
)

export default ComingSoon
