import { useState, useEffect, useCallback } from 'react'
import { Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { playAudio } from '../utils/audio.js'
import { formatCurrency } from '../utils/currencies.js'

export default function BetikaTurboDesk({
  activeAsset,
  userBalance = 50000,
  onUpdateBalance,
  currency = 'KES',
  showNotice,
}) {
  const [timeLeft, setTimeLeft] = useState(45)
  const [stake, setStake] = useState('250')
  const [activeContract, setActiveContract] = useState(null)
  const [tickPrice, setTickPrice] = useState(activeAsset?.price || 67482.16)
  const [settledResult, setSettledResult] = useState(null)

  // Rapid price tick simulation every 1.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.48) * (tickPrice * 0.001)
      const nextPrice = Math.round((tickPrice + delta) * 100) / 100
      setTickPrice(nextPrice)
    }, 1500)
    return () => clearInterval(interval)
  }, [tickPrice])

  const handleRoundExpire = useCallback(() => {
    if (!activeContract) return

    const isHigh = activeContract.direction === 'HIGH'
    const won = isHigh ? tickPrice >= activeContract.strike : tickPrice <= activeContract.strike

    if (won) {
      const winPayout = Math.round(activeContract.stake * 1.95)
      playAudio('win')
      onUpdateBalance?.(winPayout)
      setSettledResult({ won: true, amount: winPayout })
      showNotice?.(`🎉 60s Contract WON! Paid ${currency} ${winPayout.toLocaleString()} to M-PESA balance!`)
    } else {
      playAudio('sell')
      setSettledResult({ won: false, amount: activeContract.stake })
      showNotice?.(`Contract expired out of the money.`)
    }

    setActiveContract(null)
  }, [activeContract, tickPrice, onUpdateBalance, currency, showNotice])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Round expires!
          handleRoundExpire()
          return 60
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [handleRoundExpire])

  const handlePlaceOrder = (direction) => {
    const numStake = Number(stake) || 0
    if (numStake <= 0) return
    if (numStake > userBalance) {
      showNotice?.('Insufficient balance. Please deposit via M-PESA.')
      return
    }

    playAudio('bet')
    onUpdateBalance?.(-numStake)
    setActiveContract({
      direction,
      strike: tickPrice,
      stake: numStake,
      odds: 1.95,
      potentialWin: Math.round(numStake * 1.95),
    })
    setSettledResult(null)
    showNotice?.(`Contract placed: ${direction} at ${formatCurrency(tickPrice, currency)}`)
  }

  const potentialReturn = Math.round((Number(stake) || 0) * 1.95)

  return (
    <div style={{
      background: 'var(--b-bg-surface)',
      border: '1px solid var(--b-border)',
      borderRadius: 14,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>
              60-SECOND TURBO CONTRACTS · {activeAsset?.symbol}
            </h3>
            <span className="betika-tab-badge">⚡ 1.95x FIXED PAYOUT</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--b-text-sub)', margin: '4px 0 0 0' }}>
            Predict if {activeAsset?.symbol} will close ABOVE or BELOW strike at round expiry. Instant payout!
          </p>
        </div>

        {/* Round Clock */}
        <div style={{
          background: '#09130e',
          border: '1px solid var(--b-border)',
          borderRadius: 8,
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Clock size={16} style={{ color: 'var(--b-yellow)' }} />
          <div>
            <div style={{ fontSize: 10, color: 'var(--b-text-sub)' }}>ROUND CLOSES IN</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--b-yellow)', fontVariantNumeric: 'tabular-nums' }}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}s
            </div>
          </div>
        </div>
      </div>

      {/* Live Strike HUD & Tick Line */}
      <div style={{
        background: '#060c08',
        border: '1px solid var(--b-border)',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--b-text-sub)' }}>CURRENT MARKET PRICE</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>
            {formatCurrency(tickPrice, currency)}
          </div>
        </div>

        {activeContract ? (
          <div style={{
            background: 'var(--b-bg-card)',
            border: '1px solid var(--b-border)',
            borderRadius: 8,
            padding: '8px 14px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: 10, color: 'var(--b-text-sub)' }}>ACTIVE STRIKE TARGET</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: activeContract.direction === 'HIGH' ? 'var(--b-green)' : 'var(--b-red)' }}>
              {activeContract.direction} @ {formatCurrency(activeContract.strike, currency)}
            </div>
          </div>
        ) : settledResult ? (
          <div style={{
            background: settledResult.won ? 'var(--b-green-dim)' : 'rgba(255, 59, 86, 0.12)',
            color: settledResult.won ? 'var(--b-green)' : 'var(--b-red)',
            padding: '6px 12px',
            borderRadius: 6,
            fontWeight: 800,
            fontSize: 12
          }}>
            {settledResult.won ? `WON ${currency} ${settledResult.amount.toLocaleString()} (1.95x)` : `Contract Expired OTM`}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--b-green)', fontWeight: 800 }}>
            ● LIVE STP TICK STREAMING
          </div>
        )}
      </div>

      {/* Stake & Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 16,
        alignItems: 'center',
        background: '#0a1410',
        padding: 16,
        borderRadius: 10,
        border: '1px solid var(--b-border)',
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--b-text-sub)' }}>STAKE AMOUNT</span>
            <span style={{ fontSize: 11, color: 'var(--b-yellow)' }}>Balance: {currency} {userBalance.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {['100', '250', '500', '1000', '2500'].map((val) => (
              <button
                key={val}
                type="button"
                className={`betika-stake-chip ${stake === val ? 'selected' : ''}`}
                onClick={() => {
                  playAudio('click')
                  setStake(val)
                }}
              >
                {val}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--b-text-sub)' }}>
            Payout on Win: <b style={{ color: 'var(--b-yellow)' }}>{currency} {potentialReturn.toLocaleString()}</b> (1.95x)
          </div>
        </div>

        {/* Binary High / Low Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={() => handlePlaceOrder('HIGH')}
            disabled={!!activeContract}
            style={{
              background: 'linear-gradient(135deg, #00e267, #00b84c)',
              color: '#060b08',
              border: 'none',
              borderRadius: 10,
              padding: '16px 12px',
              fontWeight: 900,
              fontSize: 15,
              cursor: activeContract ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 4px 14px var(--b-green-glow)',
              opacity: activeContract ? 0.6 : 1,
            }}
          >
            <TrendingUp size={22} />
            <span>HIGH / CALL</span>
            <span style={{ fontSize: 11, fontWeight: 800 }}>1.95x</span>
          </button>

          <button
            onClick={() => handlePlaceOrder('LOW')}
            disabled={!!activeContract}
            style={{
              background: 'linear-gradient(135deg, #ff3b56, #d91c36)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '16px 12px',
              fontWeight: 900,
              fontSize: 15,
              cursor: activeContract ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 4px 14px var(--b-red-dim)',
              opacity: activeContract ? 0.6 : 1,
            }}
          >
            <TrendingDown size={22} />
            <span>LOW / PUT</span>
            <span style={{ fontSize: 11, fontWeight: 800 }}>1.95x</span>
          </button>
        </div>
      </div>
    </div>
  )
}
