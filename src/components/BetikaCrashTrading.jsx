import { useState, useEffect } from 'react'
import { Rocket, DollarSign } from 'lucide-react'
import { playAudio } from '../utils/audio.js'

export default function BetikaCrashTrading({
  userBalance = 50000,
  onUpdateBalance,
  currency = 'KES',
  showNotice,
}) {
  const [gameState, setGameState] = useState('idle') // 'idle' | 'flying' | 'crashed'
  const [multiplier, setMultiplier] = useState(1.0)
  const [stake, setStake] = useState('200')
  const [hasBet, setHasBet] = useState(false)
  const [history, setHistory] = useState([
    { mult: 2.14, high: false },
    { mult: 1.45, high: false },
    { mult: 12.80, high: true },
    { mult: 1.08, high: false },
    { mult: 5.60, high: true },
    { mult: 3.22, high: false },
    { mult: 24.50, high: true },
  ])
  const [crashPoint, setCrashPoint] = useState(2.5)
  const [payoutWon, setPayoutWon] = useState(null)

  // Start round
  const handleStartRound = () => {
    const numStake = Number(stake) || 0
    if (numStake <= 0) {
      showNotice?.('Please enter a stake amount.')
      return
    }
    if (numStake > userBalance) {
      showNotice?.('Insufficient balance. Please deposit via M-PESA.')
      return
    }

    playAudio('bet')
    onUpdateBalance?.(-numStake)

    // Calculate crash point with exponential distribution
    // mostly between 1.2x and 6x, occasionally 15x-50x+
    const rand = Math.random()
    let point
    if (rand < 0.1) point = 1.1 + Math.random() * 0.3
    else if (rand < 0.5) point = 1.4 + Math.random() * 1.8
    else if (rand < 0.85) point = 2.8 + Math.random() * 3.5
    else point = 6.0 + Math.random() * 25.0

    setCrashPoint(Math.round(point * 100) / 100)
    setMultiplier(1.0)
    setGameState('flying')
    setHasBet(true)
    setPayoutWon(null)
  }

  // Animation loop when flying
  useEffect(() => {
    if (gameState !== 'flying') return undefined

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000
      // Exponential curve: mult = e^(0.18 * elapsedSec)
      const current = Math.exp(0.24 * elapsedSec)
      const rounded = Math.round(current * 100) / 100

      if (rounded >= crashPoint) {
        // Crashed!
        clearInterval(interval)
        setMultiplier(crashPoint)
        setGameState('crashed')
        setHasBet(false)
        playAudio('sell')
        setHistory((h) => [{ mult: crashPoint, high: crashPoint >= 5.0 }, ...h.slice(0, 10)])
      } else {
        setMultiplier(rounded)
      }
    }, 45)

    return () => clearInterval(interval)
  }, [gameState, crashPoint])

  // Player manual cashout
  const handleCashout = () => {
    if (gameState !== 'flying' || !hasBet) return

    const numStake = Number(stake) || 0
    const winAmount = Math.round(numStake * multiplier)
    playAudio('cashout')
    onUpdateBalance?.(winAmount)
    setHasBet(false)
    setPayoutWon(winAmount)
    showNotice?.(`🚀 CASHOUT SUCCESS! You won ${currency} ${winAmount.toLocaleString()} at ${multiplier.toFixed(2)}x!`)
  }

  const currentCashoutVal = Math.round((Number(stake) || 0) * multiplier)

  return (
    <div className="betika-crash-desk">
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>
              TRADEX ROCKET MULTIPLIER (AVIATOR STYLE)
            </h3>
            <span className="betika-tab-badge yellow">🔥 100X MAX</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--b-text-sub)', margin: '4px 0 0 0' }}>
            Watch the market multiplier climb in real-time. Cash out before the sudden candle retrace!
          </p>
        </div>

        {/* History Chips */}
        <div className="betika-crash-history-strip">
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--b-text-dim)', marginRight: 4 }}>HISTORY:</span>
          {history.map((h, i) => (
            <span key={i} className={`betika-crash-chip ${h.high ? 'high' : ''}`}>
              {h.mult.toFixed(2)}x
            </span>
          ))}
        </div>
      </div>

      {/* Center Flight Canvas */}
      <div className="betika-crash-multiplier-screen">
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(0, 226, 103, 0.08), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className={`betika-crash-huge-num ${gameState === 'crashed' ? 'crashed' : ''}`}>
          {multiplier.toFixed(2)}x
        </div>

        <div className="betika-crash-sub">
          {gameState === 'idle' && 'READY TO LAUNCH · PLACE STAKE'}
          {gameState === 'flying' && 'FLIGHT IN PROGRESS · CASH OUT ANYTIME'}
          {gameState === 'crashed' && `CRASHED @ ${crashPoint.toFixed(2)}x · NEXT ROUND READY`}
        </div>

        {payoutWon && (
          <div style={{
            marginTop: 12,
            background: 'var(--b-green)',
            color: '#060b08',
            padding: '6px 16px',
            borderRadius: 20,
            fontWeight: 900,
            fontSize: 14,
            boxShadow: '0 4px 18px var(--b-green-glow)',
            zIndex: 10,
          }}>
            WON {currency} {payoutWon.toLocaleString()}!
          </div>
        )}
      </div>

      {/* Bottom Betting Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 16,
        background: '#09130e',
        border: '1px solid var(--b-border)',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--b-text-sub)' }}>STAKE AMOUNT</span>
            <span style={{ fontSize: 11, color: 'var(--b-yellow)' }}>Balance: {currency} {userBalance.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="betika-stake-input-wrap" style={{ margin: 0, flex: 1 }}>
              <input
                type="number"
                className="betika-stake-input"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                disabled={gameState === 'flying'}
                min="50"
                step="50"
              />
              <span className="betika-stake-currency">{currency}</span>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              {['100', '250', '500', '1000'].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`betika-stake-chip ${stake === val ? 'selected' : ''}`}
                  onClick={() => {
                    playAudio('click')
                    setStake(val)
                  }}
                  disabled={gameState === 'flying'}
                  style={{ padding: '8px 10px' }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {gameState === 'flying' && hasBet ? (
            <button
              className="betika-cashout-btn"
              onClick={handleCashout}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: 16,
                fontWeight: 900,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #ffdf00, #ffb700)',
                color: '#060b08',
                boxShadow: '0 4px 20px var(--b-yellow-glow)',
              }}
            >
              <DollarSign size={20} />
              CASH OUT NOW · {currency} {currentCashoutVal.toLocaleString()}
            </button>
          ) : (
            <button
              className="betika-place-bet-btn"
              onClick={handleStartRound}
              disabled={gameState === 'flying'}
              style={{ margin: 0, padding: '16px', fontSize: 15 }}
            >
              <Rocket size={18} />
              LAUNCH FLIGHT ({currency} {Number(stake || 0).toLocaleString()})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
