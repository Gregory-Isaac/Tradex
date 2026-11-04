import { useState } from 'react'
import { Trophy, TrendingUp, TrendingDown, Dices, Clock } from 'lucide-react'
import { playAudio } from '../utils/audio.js'

const JACKPOT_MATCHES = [
  { id: 'J1', symbol: 'BTC', name: 'Bitcoin', currentPrice: 67482.16, benchmark: '$67,500.00' },
  { id: 'J2', symbol: 'SCOM', name: 'Safaricom PLC', currentPrice: 18.25, benchmark: 'KES 18.50' },
  { id: 'J3', symbol: 'XAU', name: 'Gold Spot', currentPrice: 2748.50, benchmark: '$2,750.00' },
  { id: 'J4', symbol: 'EQTY', name: 'Equity Group', currentPrice: 44.50, benchmark: 'KES 45.00' },
  { id: 'J5', symbol: 'EUR', name: 'EUR / USD', currentPrice: 1.0842, benchmark: '1.0850' },
]

export default function BetikaJackpotDesk({
  userBalance = 50000,
  onUpdateBalance,
  currency = 'KES',
  showNotice,
}) {
  const [picks, setPicks] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState('')

  const handlePick = (matchId, direction) => {
    playAudio('click')
    setPicks((prev) => ({ ...prev, [matchId]: direction }))
  }

  const handleLuckyDip = () => {
    playAudio('click')
    const randomized = {}
    JACKPOT_MATCHES.forEach((m) => {
      randomized[m.id] = Math.random() > 0.5 ? 'BULL' : 'BEAR'
    })
    setPicks(randomized)
    showNotice?.('🎲 Lucky Dip generated random market trend selections!')
  }

  const allPicked = JACKPOT_MATCHES.every((m) => picks[m.id])
  const entryFee = 50

  const handleSubmitTicket = () => {
    if (!allPicked) {
      showNotice?.('Please select BULLISH or BEARISH for all 5 assets.')
      return
    }
    if (userBalance < entryFee) {
      showNotice?.('Insufficient balance for KES 50 jackpot ticket.')
      return
    }

    playAudio('win')
    onUpdateBalance?.(-entryFee)
    const id = `JP-${Math.floor(100000 + Math.random() * 900000)}`
    setTicketId(id)
    setSubmitted(true)
    showNotice?.(`🏆 Jackpot Ticket #${id} placed successfully! Good luck on KES 10,000,000!`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Betika Mega Jackpot Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1b3524 0%, #0d1e15 100%)',
        border: '1px solid rgba(255, 223, 0, 0.4)',
        borderRadius: 14,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--b-yellow)',
            color: '#060b08',
            fontSize: 11,
            fontWeight: 900,
            padding: '3px 8px',
            borderRadius: 4,
            marginBottom: 8,
          }}>
            <Trophy size={13} /> OFFICIAL DAILY GRAND JACKPOT
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 6px 0' }}>
            PREDICT 5 ASSET TRENDS & WIN <span style={{ color: 'var(--b-yellow)' }}>KES 10,000,000</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--b-text-sub)', margin: 0, maxWidth: 500 }}>
            Pick whether each asset closes above or below today’s benchmark price at 22:00 EAT. Entry is only <b>KES 50</b>!
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--b-yellow)', letterSpacing: '-0.5px' }}>
            KES 10M
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--b-green)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <Clock size={13} /> CLOSES IN 14H 28M
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
          SELECT 5 ASSET PREDICTIONS ({Object.keys(picks).length} / 5 SELECTED)
        </div>
        <button
          onClick={handleLuckyDip}
          style={{
            background: 'rgba(255, 223, 0, 0.12)',
            border: '1px solid var(--b-yellow)',
            color: 'var(--b-yellow)',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Dices size={15} /> LUCKY DIP (AUTO PICK)
        </button>
      </div>

      {/* 5 Match Predictions Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {JACKPOT_MATCHES.map((item, idx) => {
          const selected = picks[item.id]
          return (
            <div key={item.id} className="betika-jackpot-match-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 900,
                  color: 'var(--b-yellow)'
                }}>
                  {idx + 1}
                </span>
                <div>
                  <strong style={{ fontSize: 14, color: '#fff' }}>{item.symbol} · {item.name}</strong>
                  <div style={{ fontSize: 11, color: 'var(--b-text-sub)' }}>
                    Target Benchmark: <b>{item.benchmark}</b>
                  </div>
                </div>
              </div>

              <div className="betika-jackpot-pick-btns">
                <button
                  className={`betika-jackpot-pick-btn ${selected === 'BULL' ? 'selected' : ''}`}
                  onClick={() => handlePick(item.id, 'BULL')}
                >
                  <TrendingUp size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                  BULLISH (UP)
                </button>
                <button
                  className={`betika-jackpot-pick-btn ${selected === 'BEAR' ? 'selected' : ''}`}
                  onClick={() => handlePick(item.id, 'BEAR')}
                >
                  <TrendingDown size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                  BEARISH (DOWN)
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ticket Placement Box */}
      <div style={{
        background: '#0a1410',
        border: '1px solid var(--b-border)',
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
            ENTRY FEE: <span style={{ color: 'var(--b-yellow)' }}>{currency} {entryFee}</span>
            {submitted && ticketId && (
              <span style={{ color: 'var(--b-green)', marginLeft: 8 }}>· Active Ticket: #{ticketId}</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--b-text-sub)' }}>
            Available balance: {currency} {userBalance.toLocaleString()} · Instant M-PESA payout for 5/5 hits!
          </div>
        </div>

        <button
          className="betika-place-bet-btn"
          style={{ width: 'auto', padding: '12px 28px', margin: 0 }}
          onClick={handleSubmitTicket}
          disabled={!allPicked}
        >
          <Trophy size={16} />
          {submitted ? 'ENTER ANOTHER TICKET (KES 50)' : 'SUBMIT JACKPOT TICKET (KES 50)'}
        </button>
      </div>

      {/* Recent Jackpot Winners Banner */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--b-border)',
        borderRadius: 10,
        padding: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--b-text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
          RECENT JACKPOT WINNERS 🇰🇪
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--b-text-sub)' }}>
            🎉 <b>0722***810</b> won <span style={{ color: 'var(--b-yellow)', fontWeight: 800 }}>KES 10,000,000</span> (5/5 Correct)
          </div>
          <div style={{ fontSize: 12, color: 'var(--b-text-sub)' }}>
            🎉 <b>0719***342</b> won <span style={{ color: 'var(--b-green)', fontWeight: 800 }}>KES 1,250,000</span> (Bonus 4/5)
          </div>
          <div style={{ fontSize: 12, color: 'var(--b-text-sub)' }}>
            🎉 <b>0705***991</b> won <span style={{ color: 'var(--b-yellow)', fontWeight: 800 }}>KES 10,000,000</span> (5/5 Correct)
          </div>
        </div>
      </div>
    </div>
  )
}
