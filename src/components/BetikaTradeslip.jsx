import { useState, useMemo } from 'react'
import { X, Trash2, Zap, CheckCircle2, DollarSign, Clock, ShieldCheck } from 'lucide-react'
import { playAudio } from '../utils/audio.js'

export default function BetikaTradeslip({
  selections = [],
  onRemoveSelection,
  onClearSelections,
  onPlaceTrade,
  activeTrades = [],
  onCashout,
  currency = 'KES',
  userBalance = 50000,
  isOpen = true,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('slip') // 'slip' | 'my_trades'
  const [mode, setMode] = useState('single') // 'single' | 'multi'
  const [stake, setStake] = useState('200')

  const quickStakes = ['50', '100', '250', '500', '1000', '5000']

  // Multiplier calculation
  const totalOdds = useMemo(() => {
    if (selections.length === 0) return 0
    if (mode === 'single') {
      return selections[0]?.odds || 1.95
    }
    // Accumulator: multiply all selections' odds together
    const combined = selections.reduce((acc, curr) => acc * (Number(curr.odds) || 1.95), 1)
    return Math.round(combined * 100) / 100
  }, [selections, mode])

  const numericStake = Number(stake) || 0
  const totalStake = mode === 'single' ? numericStake * Math.max(1, selections.length) : numericStake
  const possibleWin = Math.round(totalStake * totalOdds * 100) / 100
  const netProfit = Math.max(0, possibleWin - totalStake)

  const handleQuickStake = (val) => {
    playAudio('click')
    setStake(val)
  }

  const handlePlaceBet = () => {
    if (selections.length === 0 || numericStake <= 0) return
    if (totalStake > userBalance) {
      alert(`Insufficient balance. Please deposit via M-PESA.`)
      return
    }

    playAudio('bet')
    onPlaceTrade?.({
      id: `TX-${Date.now().toString().slice(-6)}`,
      mode,
      selections: [...selections],
      stake: totalStake,
      odds: totalOdds,
      possibleWin,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'active',
      cashoutValue: Math.round(totalStake * 0.92),
    })
    onClearSelections?.()
    setActiveTab('my_trades')
  }

  return (
    <aside className={`betika-tradeslip ${isOpen ? 'open' : ''}`}>
      {/* Slip Header with Tabs */}
      <div className="betika-slip-header">
        <div className="betika-slip-tabs">
          <button
            className={`betika-slip-tab ${activeTab === 'slip' ? 'active' : ''}`}
            onClick={() => {
              playAudio('click')
              setActiveTab('slip')
            }}
          >
            TRADESLIP {selections.length > 0 && `(${selections.length})`}
          </button>
          <button
            className={`betika-slip-tab ${activeTab === 'my_trades' ? 'active' : ''}`}
            onClick={() => {
              playAudio('click')
              setActiveTab('my_trades')
            }}
          >
            MY TRADES {activeTrades.length > 0 && `(${activeTrades.length})`}
          </button>
        </div>
        {onClose && (
          <button className="betika-slip-card-remove" onClick={onClose} style={{ marginLeft: 8 }}>
            <X size={18} />
          </button>
        )}
      </div>

      {activeTab === 'slip' ? (
        <>
          {/* Slip Modes: Single vs Multi (Accumulator) */}
          <div className="betika-slip-modes">
            <button
              className={`betika-mode-pill ${mode === 'single' ? 'active' : ''}`}
              onClick={() => {
                playAudio('click')
                setMode('single')
              }}
            >
              SINGLE
            </button>
            <button
              className={`betika-mode-pill ${mode === 'multi' ? 'active' : ''}`}
              onClick={() => {
                playAudio('click')
                setMode('multi')
              }}
            >
              MULTI / ACCA {selections.length > 1 && <span style={{ color: 'var(--b-yellow)' }}>🔥 BOOSTED</span>}
            </button>
          </div>

          <div className="betika-slip-body">
            {selections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 14px', color: 'var(--b-text-sub)' }}>
                <Zap size={32} style={{ color: 'var(--b-yellow)', marginBottom: 12, opacity: 0.8 }} />
                <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 6 }}>
                  Your Tradeslip is empty
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  Click any odds button (e.g. <b>HIGH / CALL 1.95x</b>) on any market to add it here.
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--b-text-sub)' }}>
                    SELECTIONS ({selections.length})
                  </span>
                  <button
                    onClick={() => {
                      playAudio('click')
                      onClearSelections?.()
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--b-red)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Trash2 size={12} /> Clear all
                  </button>
                </div>

                {selections.map((sel) => (
                  <div key={sel.id || `${sel.symbol}-${sel.outcome}`} className="betika-slip-card">
                    <div className="betika-slip-card-head">
                      <div>
                        <div className="betika-slip-card-title">{sel.symbol} · {sel.name}</div>
                        <span style={{ fontSize: 11, color: 'var(--b-text-sub)' }}>Market: {sel.marketName || 'Next 60s Candle'}</span>
                      </div>
                      <button
                        className="betika-slip-card-remove"
                        onClick={() => {
                          playAudio('click')
                          onRemoveSelection?.(sel)
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="betika-slip-card-outcome">
                      <span className="betika-outcome-text">
                        Pick: <b>{sel.outcome}</b>
                      </span>
                      <span className="betika-outcome-odd">{sel.odds}x</span>
                    </div>
                  </div>
                ))}

                {/* Quick Stake Selector Buttons */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--b-text-sub)', marginBottom: 4 }}>
                    QUICK STAKE ({currency})
                  </div>
                  <div className="betika-quick-stakes">
                    {quickStakes.map((val) => (
                      <button
                        key={val}
                        className={`betika-stake-chip ${stake === val ? 'selected' : ''}`}
                        onClick={() => handleQuickStake(val)}
                      >
                        {val}
                      </button>
                    ))}
                    <button
                      className="betika-stake-chip"
                      onClick={() => handleQuickStake('10000')}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Stake Input */}
                <div className="betika-stake-input-wrap">
                  <input
                    type="number"
                    className="betika-stake-input"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    placeholder="Stake amount"
                    min="10"
                    step="50"
                  />
                  <span className="betika-stake-currency">{currency}</span>
                </div>

                {/* Calculation Summary */}
                <div className="betika-payout-box">
                  <div className="betika-payout-row">
                    <span>Total Stake</span>
                    <b>{currency} {totalStake.toLocaleString()}</b>
                  </div>
                  <div className="betika-payout-row">
                    <span>Total Multiplier / Odds</span>
                    <b style={{ color: 'var(--b-yellow)' }}>{totalOdds}x</b>
                  </div>
                  <div className="betika-payout-row">
                    <span>Tax / Regulatory Fee</span>
                    <span className="betika-tax-free-badge">
                      <ShieldCheck size={11} /> 0% M-PESA PROMO
                    </span>
                  </div>
                  <div className="betika-payout-row">
                    <span>Est. Net Profit</span>
                    <b style={{ color: 'var(--b-green)' }}>+{currency} {netProfit.toLocaleString()}</b>
                  </div>
                  <div className="betika-payout-row highlight">
                    <span>POSSIBLE PAYOUT</span>
                    <span>{currency} {possibleWin.toLocaleString()}</span>
                  </div>
                </div>

                {/* Main Place Trade Button */}
                <button
                  className="betika-place-bet-btn"
                  onClick={handlePlaceBet}
                  disabled={numericStake <= 0}
                >
                  <Zap size={18} />
                  PLACE TRADE · {currency} {totalStake.toLocaleString()}
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        /* MY TRADES TAB */
        <div className="betika-slip-body">
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--b-text-sub)', marginBottom: 4 }}>
            ACTIVE & SETTLED TRADES ({activeTrades.length})
          </div>

          {activeTrades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 14px', color: 'var(--b-text-sub)' }}>
              <Clock size={32} style={{ color: 'var(--b-green)', marginBottom: 12, opacity: 0.8 }} />
              <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 6 }}>
                No active trades right now
              </div>
              <div style={{ fontSize: 12 }}>
                Place a trade from the Tradeslip to monitor live payouts and early cashout here.
              </div>
            </div>
          ) : (
            activeTrades.map((trade) => {
              const isWon = trade.status === 'won'
              return (
                <div key={trade.id} className="betika-cashout-card">
                  <div className="betika-cashout-head">
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--b-yellow)' }}>
                      #{trade.id} · {trade.mode.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--b-text-sub)' }}>{trade.createdAt}</span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                    {trade.selections.map((s) => `${s.symbol} (${s.outcome})`).join(' + ')}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--b-text-sub)' }}>
                    <span>Stake: <b>{currency} {trade.stake.toLocaleString()}</b></span>
                    <span>Odds: <b style={{ color: 'var(--b-yellow)' }}>{trade.odds}x</b></span>
                  </div>

                  {trade.status === 'active' ? (
                    <button
                      className="betika-cashout-btn"
                      onClick={() => {
                        playAudio('cashout')
                        onCashout?.(trade)
                      }}
                    >
                      <DollarSign size={15} />
                      EARLY CASH OUT · {currency} {Number(trade.cashoutValue || trade.stake * 0.95).toLocaleString()}
                    </button>
                  ) : (
                    <div style={{
                      padding: 8,
                      borderRadius: 6,
                      background: isWon ? 'var(--b-green-dim)' : 'rgba(255, 223, 0, 0.12)',
                      color: isWon ? 'var(--b-green)' : 'var(--b-yellow)',
                      fontWeight: 800,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <CheckCircle2 size={14} />
                      {isWon ? `WON & PAID: ${currency} ${trade.possibleWin.toLocaleString()}` : `CASHED OUT: ${currency} ${Number(trade.cashoutValue).toLocaleString()}`}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </aside>
  )
}
