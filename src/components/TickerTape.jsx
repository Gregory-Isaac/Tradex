import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react'
import { formatCurrency } from '../utils/currencies.js'
import './TickerTape.css'

const INITIAL_TICKER = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67482.16, change: 2.84, high24: 68120, low24: 65200 },
  { symbol: 'SCOM', name: 'Safaricom PLC', price: 18.25, change: 2.24, high24: 18.80, low24: 17.90 },
  { symbol: 'ETH', name: 'Ethereum', price: 3521.84, change: 1.62, high24: 3590, low24: 3410 },
  { symbol: 'EQTY', name: 'Equity Group', price: 44.50, change: 1.80, high24: 45.20, low24: 43.80 },
  { symbol: 'KCB', name: 'KCB Group', price: 32.10, change: -0.45, high24: 32.80, low24: 31.80 },
  { symbol: 'XAU', name: 'Gold Spot', price: 2748.50, change: 0.65, high24: 2755, low24: 2732 },
  { symbol: 'USD/KES', name: 'USD / KES', price: 129.50, change: -0.12, high24: 129.90, low24: 129.10 },
  { symbol: 'SOL', name: 'Solana', price: 182.37, change: -0.74, high24: 188.4, low24: 179.1 },
  { symbol: 'NVDA', name: 'NVIDIA', price: 142.88, change: 4.26, high24: 144.5, low24: 138.2 },
]

export default function TickerTape({ onSelectSymbol, currency = 'USD' }) {
  const [items, setItems] = useState(INITIAL_TICKER)
  const [flashMap, setFlashMap] = useState({})

  useEffect(() => {
    // Simulated live websocket tick updates every 3.5 seconds
    const interval = setInterval(() => {
      const targetIdx = Math.floor(Math.random() * items.length)
      const deltaPercent = (Math.random() * 0.4 - 0.18) / 100
      
      setItems((prev) => {
        const next = [...prev]
        const current = next[targetIdx]
        const newPrice = Math.round((current.price * (1 + deltaPercent)) * 10000) / 10000
        const isUp = newPrice >= current.price

        next[targetIdx] = {
          ...current,
          price: newPrice,
          change: Math.round((current.change + (isUp ? 0.04 : -0.04)) * 100) / 100,
        }

        setFlashMap((f) => ({ ...f, [current.symbol]: isUp ? 'flash-up' : 'flash-down' }))
        setTimeout(() => {
          setFlashMap((f) => ({ ...f, [current.symbol]: '' }))
        }, 1200)

        return next
      })
    }, 3200)

    return () => clearInterval(interval)
  }, [items.length])

  return (
    <div className="ticker-tape-container" aria-label="Live Market Ticker Tape">
      <div className="ticker-live-badge">
        <span className="ticker-pulse-dot" />
        <Zap size={11} className="ticker-icon" />
        <span className="ticker-label">FEED</span>
      </div>
      <div className="ticker-scroll-track">
        {items.concat(items).map((item, idx) => {
          const isUp = item.change >= 0
          const flash = flashMap[item.symbol] || ''
          return (
            <button
              key={`${item.symbol}-${idx}`}
              className={`ticker-item ${flash}`}
              onClick={() => onSelectSymbol?.(item.symbol)}
              title={`Click to view ${item.name}`}
            >
              <span className="ticker-sym">{item.symbol}</span>
              <span className="ticker-val">
                {formatCurrency(item.price, currency, item.price < 10 ? 4 : 2)}
              </span>
              <span className={`ticker-chg ${isUp ? 'positive' : 'negative'}`}>
                {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {isUp ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
