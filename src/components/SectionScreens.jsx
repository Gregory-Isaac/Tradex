import { useState, useMemo, useEffect } from 'react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart
} from 'recharts'
import {
  ArrowDownLeft, ArrowDownRight, ArrowUpRight, Bitcoin, Check, ChevronDown, LogOut,
  Clock3, CreditCard, Download, Plus, RefreshCw, Search, ShieldCheck,
  Sparkles, Wallet, ArrowLeftRight, Key, Copy, CheckCheck,
  TrendingUp, Layers, Flame, Award, Globe, UserRound
} from 'lucide-react'
import CandleChart from './CandleChart.jsx'
import { playAudio } from '../utils/audio.js'
import { formatCurrency, formatCompactCurrency, CURRENCIES } from '../utils/currencies.js'
import { readApiResponse } from '../api.js'
import './SectionScreens.css'

const initialPortfolioRows = [
  { symbol: 'BTC', name: 'Bitcoin', quantity: 1.284, entryPrice: 62200, price: 67482.16, color: '#f7931a' },
  { symbol: 'ETH', name: 'Ethereum', quantity: 12.48, entryPrice: 3320, price: 3521.84, color: '#8a92b2' },
  { symbol: 'NVDA', name: 'NVIDIA', quantity: 180, entryPrice: 126.8, price: 142.88, color: '#8bc34a' },
  { symbol: 'SOL', name: 'Solana', quantity: 64.2, entryPrice: 186.2, price: 182.37, color: '#9c78ff' },
]

export default function SectionScreens({
  activeNav,
  assets,
  activeAsset,
  setActiveAsset,
  showNotice,
  onSignOut,
  user,
  currency = 'USD',
  setCurrency,
  onOpenDeposit,
  onOpenWithdraw,
  depositRefreshKey = 0,
  positions = initialPortfolioRows,
  setPositions,
}) {
  // Trade state
  const [side, setSide] = useState('Buy')
  const [amount, setAmount] = useState('0.25')
  const [orderType, setOrderType] = useState('Market')
  const [leverage, setLeverage] = useState('1x')
  const [limitPrice, setLimitPrice] = useState('67482.16')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [period, setPeriod] = useState('1W')

  // Markets filter
  const [marketFilter, setMarketFilter] = useState('All assets')
  const [query, setQuery] = useState('')

  // Settings toggles & state
  const [toggles, setToggles] = useState({
    'Two-factor authentication (Hardware Key / TOTP)': true,
    'Institutional execution confirmations': true,
    'Real-time price & liquidation alerts': true,
    'Weekly certified performance statements': true,
    'Zero-latency simulated fills': true,
  })
  const [apiKeyGenerated, setApiKeyGenerated] = useState(false)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)
  const [walletDeposits, setWalletDeposits] = useState(null)
  const [walletDepositError, setWalletDepositError] = useState('')

  useEffect(() => {
    if (activeNav !== 'Wallet' || !user?.id) return undefined
    let active = true

    fetch('/api/wallet/deposits', { credentials: 'include' })
      .then(async (response) => {
        const data = await readApiResponse(response)
        if (!response.ok) throw new Error(data.error || 'Unable to load M-Pesa deposits.')
        return data.deposits
      })
      .then((deposits) => {
        if (active) {
          setWalletDeposits(deposits)
          setWalletDepositError('')
        }
      })
      .catch((error) => { if (active) setWalletDepositError(error.message) })

    return () => { active = false }
  }, [activeNav, user?.id, depositRefreshKey])

  const selected = activeAsset || assets[0]
  const currentPrice = selected.price
  const qtyNumber = Number(amount) || 0
  const orderTotal = qtyNumber * (orderType === 'Limit' ? (Number(limitPrice) || currentPrice) : currentPrice)

  // Order Book simulated data
  const orderBook = useMemo(() => {
    const base = currentPrice
    const asks = [
      { price: base * 1.004, size: 0.84, total: 3.82 },
      { price: base * 1.003, size: 1.45, total: 2.98 },
      { price: base * 1.002, size: 0.62, total: 1.53 },
      { price: base * 1.001, size: 0.91, total: 0.91 },
    ].reverse()

    const bids = [
      { price: base * 0.999, size: 1.15, total: 1.15 },
      { price: base * 0.998, size: 0.78, total: 1.93 },
      { price: base * 0.997, size: 2.05, total: 3.98 },
      { price: base * 0.996, size: 1.40, total: 5.38 },
    ]
    return { asks, bids, spread: (base * 0.002).toFixed(2) }
  }, [currentPrice])

  // Recent simulated market trades
  const recentTrades = useMemo(() => [
    { time: '14:24:19', price: currentPrice * 1.0002, size: 0.42, side: 'buy' },
    { time: '14:24:15', price: currentPrice, size: 1.15, side: 'sell' },
    { time: '14:24:08', price: currentPrice * 0.9998, size: 0.08, side: 'buy' },
    { time: '14:23:59', price: currentPrice * 1.0001, size: 2.40, side: 'buy' },
    { time: '14:23:51', price: currentPrice * 0.9999, size: 0.65, side: 'sell' },
  ], [currentPrice])

  const handlePlaceOrder = () => {
    if (qtyNumber <= 0) {
      showNotice('Please enter a valid order quantity.')
      return
    }

    playAudio(side === 'Buy' ? 'buy' : 'sell')

    if (side === 'Buy') {
      // Add or update position
      const existing = positions.find((p) => p.symbol === selected.symbol)
      if (existing) {
        setPositions?.(
          positions.map((p) =>
            p.symbol === selected.symbol
              ? { ...p, quantity: Math.round((p.quantity + qtyNumber) * 1000) / 1000 }
              : p
          )
        )
      } else {
        setPositions?.([
          ...positions,
          {
            symbol: selected.symbol,
            name: selected.name,
            quantity: qtyNumber,
            entryPrice: currentPrice,
            price: currentPrice,
            color: selected.color,
          },
        ])
      }
      showNotice(`Filled: Bought ${qtyNumber} ${selected.symbol} at ${formatCurrency(currentPrice, currency)}`)
    } else {
      // Sell position
      const existing = positions.find((p) => p.symbol === selected.symbol)
      if (!existing || existing.quantity < qtyNumber) {
        showNotice(`Insufficient ${selected.symbol} holding to sell.`)
        return
      }
      if (existing.quantity <= qtyNumber) {
        setPositions?.(positions.filter((p) => p.symbol !== selected.symbol))
      } else {
        setPositions?.(
          positions.map((p) =>
            p.symbol === selected.symbol
              ? { ...p, quantity: Math.round((p.quantity - qtyNumber) * 1000) / 1000 }
              : p
          )
        )
      }
      showNotice(`Filled: Sold ${qtyNumber} ${selected.symbol} at ${formatCurrency(currentPrice, currency)}`)
    }
  }

  const handleClosePosition = (symbol) => {
    playAudio('sell')
    setPositions?.(positions.filter((p) => p.symbol !== symbol))
    showNotice(`Position ${symbol} closed at market price. P&L settled to cash.`)
  }

  const handleExportStatement = () => {
    playAudio('click')
    const headers = ['Date', 'Asset', 'Type', 'Amount', 'Execution Price', 'Total Value (USD)', 'Status']
    const rows = [
      ['2026-10-31 11:42', 'BTC', 'BUY', '0.25 BTC', '$67,482.16', '$16,870.54', 'FILLED'],
      ['2026-10-30 18:20', 'USD', 'DEPOSIT (M-PESA)', 'KES 50,000', '$386.10', '$386.10', 'CONFIRMED'],
      ['2026-10-29 14:15', 'NVDA', 'BUY', '15 shares', '$142.88', '$2,143.20', 'FILLED'],
      ['2026-10-28 09:30', 'ETH', 'STAKING YIELD', '0.042 ETH', '$3,521.84', '$147.91', 'CREDITED'],
      ['2026-10-27 16:04', 'SOL', 'SELL', '10.0 SOL', '$184.20', '$1,842.00', 'FILLED'],
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `TradeX_Statement_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showNotice('Official TradeX Statement downloaded successfully.')
  }

  const handleGenerateApiKey = () => {
    playAudio('success')
    setApiKeyGenerated(true)
    showNotice('Algorithmic Trading API Key generated with read & execute permissions.')
  }

  // Filtered assets for Markets screen
  const filteredAssets = assets.filter(
    (a) =>
      (marketFilter === 'All assets' || a.kind === marketFilter.toLowerCase()) &&
      `${a.name} ${a.symbol} ${a.pair}`.toLowerCase().includes(query.toLowerCase())
  )

  /* =========================================================================
     1. TRADE DESK (Institutional Execution Platform)
     ========================================================================= */
  if (activeNav === 'Trade') {
    return (
      <div className="screen-content trade-screen-content">
        {/* Pro Execution Header Ribbon */}
        <div className="trade-pair-ribbon">
          <div className="pair-main">
            <span className="coin-mini" style={{ '--coin-color': selected.color }}>
              {selected.symbol === 'BTC' ? <Bitcoin size={16} /> : selected.symbol.slice(0, 1)}
            </span>
            <div>
              <div className="pair-title">
                <strong>{selected.pair}</strong>
                <span className="pair-type-tag">PERP / SPOT</span>
              </div>
              <small>{selected.name}</small>
            </div>
            <div className="pair-price-badge">
              <strong>{formatCurrency(currentPrice, currency, currentPrice < 10 ? 4 : 2)}</strong>
              <span className={selected.change >= 0 ? 'positive' : 'negative'}>
                {selected.change >= 0 ? '+' : ''}{selected.change}%
              </span>
            </div>
          </div>

          <div className="pair-stats">
            <div><small>24h High</small><b>{formatCurrency(currentPrice * 1.024, currency)}</b></div>
            <div><small>24h Low</small><b>{formatCurrency(currentPrice * 0.978, currency)}</b></div>
            <div><small>24h Volume</small><b>$1.42B</b></div>
            <div><small>Funding / 8h</small><b className="positive">0.0100%</b></div>
          </div>

          <div className="pair-actions">
            <span className="screen-market-open"><i /> Institutional Liquidity Active</span>
          </div>
        </div>

        {/* Trade 3-Column Grid: Chart + Order Book + Order Ticket */}
        <div className="trade-pro-layout">
          {/* Main Chart Area */}
          <div className="trade-chart-column">
            <section className="panel screen-card">
              <CandleChart
                asset={selected}
                range={period}
                onRangeChange={setPeriod}
                currency={currency}
              />
            </section>

            {/* Active Positions Table */}
            <section className="panel screen-card positions-panel">
              <div className="screen-section-heading">
                <div>
                  <h2>Open Positions ({positions.length})</h2>
                  <p>Real-time mark-to-market valuations and liquidation safeguards</p>
                </div>
                <button className="screen-text-button" onClick={() => showNotice('All positions refreshed')}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              <div className="screen-table-wrap">
                <table className="screen-table">
                  <thead>
                    <tr>
                      <th>ASSET</th>
                      <th>SIZE</th>
                      <th>ENTRY PRICE</th>
                      <th>MARK PRICE</th>
                      <th>VALUE</th>
                      <th>UNREALIZED P&L</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos) => {
                      const valUSD = pos.quantity * currentPrice
                      const pnlUSD = (currentPrice - pos.entryPrice) * pos.quantity
                      const pnlPct = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100
                      const isProfit = pnlUSD >= 0

                      return (
                        <tr key={pos.symbol}>
                          <td>
                            <div className="screen-asset-cell">
                              <span className="screen-asset-badge" style={{ '--asset-color': pos.color }}>
                                {pos.symbol === 'BTC' ? <Bitcoin size={14} /> : pos.symbol.slice(0, 1)}
                              </span>
                              <span>
                                <strong>{pos.name}</strong>
                                <small>{pos.symbol}</small>
                              </span>
                            </div>
                          </td>
                          <td><b>{pos.quantity} {pos.symbol}</b></td>
                          <td>{formatCurrency(pos.entryPrice, currency)}</td>
                          <td><b>{formatCurrency(currentPrice, currency)}</b></td>
                          <td><b>{formatCurrency(valUSD, currency)}</b></td>
                          <td>
                            <span className={`screen-change ${isProfit ? 'screen-up' : 'screen-down'}`}>
                              {isProfit ? '+' : ''}{formatCurrency(pnlUSD, currency)} ({isProfit ? '+' : ''}{pnlPct.toFixed(2)}%)
                            </span>
                          </td>
                          <td>
                            <button
                              className="close-pos-btn"
                              onClick={() => handleClosePosition(pos.symbol)}
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Live Order Book & Recent Trades Column */}
          <div className="trade-orderbook-column">
            <section className="panel screen-card orderbook-panel">
              <div className="screen-section-heading">
                <h2>Order Book</h2>
                <span className="spread-pill">Spread: {orderBook.spread}</span>
              </div>

              {/* Asks (Sells) */}
              <div className="book-table asks-table">
                {orderBook.asks.map((a, i) => (
                  <div
                    key={i}
                    className="book-row ask-row"
                    onClick={() => { setLimitPrice(a.price.toFixed(2)); setOrderType('Limit') }}
                  >
                    <div className="depth-bar ask-bar" style={{ width: `${(a.total / 5.5) * 100}%` }} />
                    <span className="book-price negative">{formatCurrency(a.price, currency, a.price < 10 ? 4 : 2)}</span>
                    <span className="book-size">{a.size.toFixed(2)}</span>
                    <span className="book-total">{a.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Mid Market Price */}
              <div className="book-mid-price">
                <strong>{formatCurrency(currentPrice, currency)}</strong>
                <span className="positive">↗ Last fill</span>
              </div>

              {/* Bids (Buys) */}
              <div className="book-table bids-table">
                {orderBook.bids.map((b, i) => (
                  <div
                    key={i}
                    className="book-row bid-row"
                    onClick={() => { setLimitPrice(b.price.toFixed(2)); setOrderType('Limit') }}
                  >
                    <div className="depth-bar bid-bar" style={{ width: `${(b.total / 5.5) * 100}%` }} />
                    <span className="book-price positive">{formatCurrency(b.price, currency, b.price < 10 ? 4 : 2)}</span>
                    <span className="book-size">{b.size.toFixed(2)}</span>
                    <span className="book-total">{b.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Recent Trades Tape */}
              <div className="recent-trades-box">
                <div className="recent-trades-title">Recent Fills</div>
                <div className="trades-list">
                  {recentTrades.map((t, i) => (
                    <div key={i} className="trade-tape-row">
                      <span>{t.time}</span>
                      <span className={t.side === 'buy' ? 'positive' : 'negative'}>
                        {formatCurrency(t.price, currency, t.price < 10 ? 4 : 2)}
                      </span>
                      <span>{t.size} {selected.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Institutional Order Execution Ticket */}
          <div className="trade-ticket-column">
            <section className="panel screen-card order-ticket-panel">
              <div className="screen-card-head">
                <div>
                  <h2>Order Ticket</h2>
                  <p>Ultra-Low Latency Smart Router</p>
                </div>
                <span className="pro-pill">PRO VIP</span>
              </div>

              {/* Buy / Sell Toggle */}
              <div className="screen-side-toggle">
                <button
                  className={side === 'Buy' ? 'selected-buy' : ''}
                  onClick={() => setSide('Buy')}
                >
                  Buy / Long
                </button>
                <button
                  className={side === 'Sell' ? 'selected-sell' : ''}
                  onClick={() => setSide('Sell')}
                >
                  Sell / Short
                </button>
              </div>

              {/* Order Type Tabs */}
              <div className="ticket-type-tabs">
                {['Market', 'Limit', 'Stop'].map((t) => (
                  <button
                    key={t}
                    className={orderType === t ? 'active' : ''}
                    onClick={() => setOrderType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Leverage Slider */}
              <div className="leverage-selector-box">
                <div className="leverage-head">
                  <label>Execution Mode</label>
                  <span><b>{leverage}</b> Margin</span>
                </div>
                <div className="leverage-chips">
                  {['1x', '2x', '5x', '10x', '20x'].map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      className={leverage === lev ? 'lev-active' : ''}
                      onClick={() => setLeverage(lev)}
                    >
                      {lev}
                    </button>
                  ))}
                </div>
              </div>

              {orderType === 'Limit' && (
                <div className="ticket-input-field">
                  <label>Limit Price</label>
                  <div className="screen-input">
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                    />
                    <span>USD</span>
                  </div>
                </div>
              )}

              {/* Amount input */}
              <div className="ticket-input-field">
                <div className="screen-label-row">
                  <label>Amount</label>
                  <span>Available: <b>{formatCurrency(62140.84, currency)}</b></span>
                </div>
                <div className="screen-input">
                  <input
                    type="number"
                    min="0.001"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <span>{selected.symbol}</span>
                </div>
                <div className="screen-amounts">
                  {['0.1', '0.25', '0.5', '1.0'].map((v) => (
                    <button key={v} onClick={() => setAmount(v)}>{v} {selected.symbol}</button>
                  ))}
                </div>
              </div>

              {/* Take-Profit / Stop-Loss Options */}
              <div className="tp-sl-row">
                <div>
                  <label>TP Trigger</label>
                  <input
                    placeholder="Optional"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                  />
                </div>
                <div>
                  <label>SL Trigger</label>
                  <input
                    placeholder="Optional"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="ticket-summary">
                <div className="screen-total-line">
                  <span>Execution Fee</span>
                  <b className="positive">0.00% (PRO VIP)</b>
                </div>
                <div className="screen-total-line">
                  <span>Est. Total</span>
                  <strong>{formatCurrency(orderTotal, currency)}</strong>
                </div>
              </div>

              <button
                className={`screen-submit ${side === 'Sell' ? 'is-sell' : ''}`}
                onClick={handlePlaceOrder}
              >
                {side} {selected.symbol} · {formatCurrency(orderTotal, currency)} <ArrowUpRight size={15} />
              </button>

              <p className="screen-secure">
                <ShieldCheck size={14} /> Direct STP execution · Tier 1 Liquidity
              </p>
            </section>
          </div>
        </div>
      </div>
    )
  }

  /* =========================================================================
     2. PORTFOLIO & ASSET ALLOCATION
     ========================================================================= */
  if (activeNav === 'Portfolio') {
    const totalPortfolioUSD = 248560.84

    return (
      <div className="screen-content">
        <div className="screen-title-row">
          <div>
            <div className="screen-eyebrow">ASSET MANAGEMENT</div>
            <h1>Portfolio & Allocation</h1>
            <p>Comprehensive breakdown of active holdings, performance, and risk distribution.</p>
          </div>
          <div className="portfolio-top-actions">
            <button className="screen-secondary" onClick={handleExportStatement}>
              <Download size={14} /> Download Statement (CSV)
            </button>
            <button className="screen-primary" onClick={() => showNotice('Portfolio rebalancing simulator opened')}>
              <RefreshCw size={14} /> Rebalance
            </button>
          </div>
        </div>

        <div className="screen-stat-grid four">
          <article className="screen-stat">
            <div className="screen-stat-top"><span>Total Net Worth</span><span className="screen-stat-icon"><Wallet size={16} /></span></div>
            <strong>{formatCurrency(totalPortfolioUSD, currency)}</strong>
            <small className="positive">+8.24% this month</small>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-top"><span>Allocated Capital</span><span className="screen-stat-icon"><Layers size={16} /></span></div>
            <strong>{formatCurrency(186420.0, currency)}</strong>
            <small>75.0% deployed</small>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-top"><span>All-Time P&L</span><span className="screen-stat-icon"><TrendingUp size={16} /></span></div>
            <strong>+{formatCurrency(18924.3, currency)}</strong>
            <small className="positive">+12.04% ROI</small>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-top"><span>Liquid Reserves</span><span className="screen-stat-icon"><CreditCard size={16} /></span></div>
            <strong>{formatCurrency(62140.84, currency)}</strong>
            <small>Instant buying power</small>
          </article>
        </div>

        <div className="screen-two-col">
          <section className="panel screen-card">
            <div className="screen-section-heading">
              <div>
                <h2>Net Worth Trajectory</h2>
                <p>Cumulative growth curve over historical cycles</p>
              </div>
              <button className="screen-select compact-select" onClick={() => setPeriod(period === '1M' ? '1Y' : '1M')}>
                {period === '1M' ? '30 Days' : '12 Months'} <ChevronDown size={14} />
              </button>
            </div>
            <PerformanceChart height={280} currency={currency} />
            <div className="screen-chart-summary">
              <span>Cost basis: <b>{formatCurrency(229636.54, currency)}</b></span>
              <span>Net profit: <b className="positive">+{formatCurrency(18924.3, currency)}</b></span>
            </div>
          </section>

          <section className="panel screen-card allocation-card">
            <div className="screen-section-heading">
              <div>
                <h2>Target Allocation</h2>
                <p>Risk-weighted capital allocation</p>
              </div>
              <span className="pro-pill">BALANCED</span>
            </div>
            <div className="allocation-donut">
              <div>
                <strong>100%</strong>
                <span>Diversified</span>
              </div>
            </div>
            <div className="allocation-list">
              {[
                { name: 'Digital Assets (Crypto)', percent: 57, color: '#10b981', value: 142319 },
                { name: 'US Equities (Tech)', percent: 31, color: '#3b82f6', value: 77053 },
                { name: 'Cash & Yield Reserves', percent: 12, color: '#f59e0b', value: 29188 },
              ].map((x) => (
                <div key={x.name}>
                  <span><i style={{ background: x.color }} />{x.name}</span>
                  <b>{formatCurrency(x.value, currency)}</b>
                  <small>{x.percent}%</small>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Holdings Table */}
        <section className="panel screen-card">
          <div className="screen-section-heading">
            <div>
              <h2>Current Holdings & Exposure</h2>
              <p>Positions held across institutional custody vaults</p>
            </div>
            <button className="screen-text-button" onClick={handleExportStatement}>
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="screen-table-wrap">
            <table className="screen-table">
              <thead>
                <tr>
                  <th>ASSET</th>
                  <th>HOLDING</th>
                  <th>AVG ENTRY</th>
                  <th>CURRENT PRICE</th>
                  <th>MARKET VALUE</th>
                  <th>UNREALIZED P&L</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((row) => {
                  const mktVal = row.quantity * row.price
                  const pnl = (row.price - row.entryPrice) * row.quantity
                  const pnlPct = ((row.price - row.entryPrice) / row.entryPrice) * 100
                  const isUp = pnl >= 0

                  return (
                    <tr key={row.symbol}>
                      <td>
                        <div className="screen-asset-cell">
                          <span className="screen-asset-badge" style={{ '--asset-color': row.color }}>
                            {row.symbol === 'BTC' ? <Bitcoin size={16} /> : row.symbol.slice(0, 1)}
                          </span>
                          <span>
                            <strong>{row.name}</strong>
                            <small>{row.symbol}</small>
                          </span>
                        </div>
                      </td>
                      <td><b>{row.quantity} {row.symbol}</b></td>
                      <td>{formatCurrency(row.entryPrice, currency)}</td>
                      <td>{formatCurrency(row.price, currency)}</td>
                      <td><b>{formatCurrency(mktVal, currency)}</b></td>
                      <td>
                        <span className={`screen-change ${isUp ? 'screen-up' : 'screen-down'}`}>
                          {isUp ? '+' : ''}{formatCurrency(pnl, currency)} ({isUp ? '+' : ''}{pnlPct.toFixed(2)}%)
                        </span>
                      </td>
                      <td>
                        <button
                          className="screen-primary mini-btn"
                          onClick={() => {
                            setActiveAsset(assets.find((a) => a.symbol === row.symbol) || assets[0])
                            showNotice(`Switching to ${row.symbol} trade desk`)
                          }}
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  /* =========================================================================
     3. MARKETS DISCOVERY & GLOBAL INTELLIGENCE
     ========================================================================= */
  if (activeNav === 'Markets') {
    return (
      <div className="screen-content">
        <div className="screen-title-row">
          <div>
            <div className="screen-eyebrow">GLOBAL INTELLIGENCE</div>
            <h1>Markets Overview</h1>
            <p>Real-time quotes, macro indicators, and volume analytics across multi-asset classes.</p>
          </div>
          <button className="screen-secondary" onClick={() => showNotice('Market data synchronized')}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>

        {/* Global Macro Stats */}
        <div className="screen-stat-grid four">
          <article className="screen-stat">
            <div className="screen-stat-top"><span>Total Market Cap</span><span className="screen-stat-icon"><Globe size={16} /></span></div>
            <strong>$2.48 Trillion</strong>
            <small className="positive">+2.64% in 24h</small>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-top"><span>Market Sentiment</span><span className="screen-stat-icon"><Flame size={16} /></span></div>
            <strong className="positive">74 · Greed</strong>
            <small>Fear & Greed Index</small>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-top"><span>24h Global Volume</span><span className="screen-stat-icon"><ArrowLeftRight size={16} /></span></div>
            <strong>$84.2 Billion</strong>
            <small className="positive">+12.8% vs avg</small>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-top"><span>BTC Dominance</span><span className="screen-stat-icon"><Bitcoin size={16} /></span></div>
            <strong>58.42%</strong>
            <small>Altcoin season index: 38</small>
          </article>
        </div>

        {/* Full Asset Table */}
        <section className="panel screen-card full-market-card">
          <div className="screen-section-heading">
            <div>
              <h2>All Supported Instruments</h2>
              <p>Direct market execution with zero slippage guarantees</p>
            </div>
            <label className="screen-search">
              <Search size={15} />
              <input
                placeholder="Search by asset name or symbol..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          <div className="screen-market-tabs">
            {['All assets', 'Crypto', 'Stocks', 'Forex'].map((x) => (
              <button
                key={x}
                className={marketFilter === x ? 'active' : ''}
                onClick={() => setMarketFilter(x)}
              >
                {x}
              </button>
            ))}
          </div>

          <div className="screen-table-wrap">
            <table className="screen-table">
              <thead>
                <tr>
                  <th>ASSET</th>
                  <th>PRICE</th>
                  <th>24H CHANGE</th>
                  <th>24H HIGH / LOW</th>
                  <th>24H VOLUME</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => {
                  const isUp = asset.change >= 0
                  return (
                    <tr
                      key={asset.symbol}
                      onClick={() => { setActiveAsset(asset); showNotice(`Selected ${asset.symbol}`) }}
                    >
                      <td>
                        <div className="screen-asset-cell">
                          <span className="screen-asset-badge" style={{ '--asset-color': asset.color }}>
                            {asset.symbol === 'BTC' ? <Bitcoin size={16} /> : asset.symbol.slice(0, 1)}
                          </span>
                          <span>
                            <strong>{asset.name}</strong>
                            <small>{asset.pair}</small>
                          </span>
                        </div>
                      </td>
                      <td><b>{formatCurrency(asset.price, currency, asset.price < 10 ? 4 : 2)}</b></td>
                      <td>
                        <span className={`screen-change ${isUp ? 'screen-up' : 'screen-down'}`}>
                          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isUp ? '+' : ''}{asset.change.toFixed(2)}%
                        </span>
                      </td>
                      <td>
                        <div className="mini-range-bar">
                          <small>{formatCurrency(asset.price * 0.98, currency, asset.price < 10 ? 3 : 0)}</small>
                          <div className="range-track"><i style={{ width: '68%' }} /></div>
                          <small>{formatCurrency(asset.price * 1.02, currency, asset.price < 10 ? 3 : 0)}</small>
                        </div>
                      </td>
                      <td>$1.84B</td>
                      <td>
                        <button
                          className="screen-primary mini-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveAsset(asset)
                            showNotice(`Opening execution desk for ${asset.symbol}`)
                          }}
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  /* =========================================================================
     4. MULTI-ASSET WALLET & TREASURY
     ========================================================================= */
  if (activeNav === 'Wallet') {
    const kesBalance = user?.balanceKes || 0
    const usdConverted = kesBalance / 129.5

    return (
      <div className="screen-content">
        <div className="screen-title-row">
          <div>
            <div className="screen-eyebrow">INSTITUTIONAL TREASURY</div>
            <h1>Multi-Asset Wallet</h1>
            <p>Manage sovereign fiat rails, digital asset vaults, and instant M-Pesa settlements.</p>
          </div>
          <div className="portfolio-top-actions">
            <button className="screen-secondary" onClick={onOpenWithdraw}>
              <ArrowUpRight size={14} /> Withdraw Funds
            </button>
            <button className="screen-primary" onClick={onOpenDeposit}>
              <Plus size={14} /> Deposit Funds
            </button>
          </div>
        </div>

        {/* Luxury Holographic Treasury Card */}
        <section className="panel screen-card wallet-hero-premium">
          <div className="wallet-hero-glass">
            <span className="wallet-overline">
              <ShieldCheck size={14} /> TRADEX PRO ELITE TREASURY · ACCOUNT #{user?.id?.slice(0, 8).toUpperCase() || 'TX-8924'}
            </span>
            <div className="wallet-big-balance">
              {formatCurrency(62140.84 + usdConverted, currency)}
            </div>
            <div className="wallet-kes-badge">
              <span className="mpesa-pill">M-PESA BALANCE</span>
              <strong>KES {kesBalance.toLocaleString()}</strong>
              <small>≈ ${usdConverted.toFixed(2)} USD</small>
            </div>
            <div className="wallet-hero-buttons">
              <button className="hero-deposit-btn" onClick={onOpenDeposit}>
                <Plus size={15} /> Instant M-Pesa Deposit
              </button>
              <button className="hero-withdraw-btn" onClick={onOpenWithdraw}>
                <ArrowUpRight size={15} /> Request Payout
              </button>
            </div>
          </div>
        </section>

        <div className="screen-two-col">
          <section className="panel screen-card">
            <div className="screen-section-heading">
              <div>
                <h2>Asset Balances</h2>
                <p>Available for immediate spot or derivatives trading</p>
              </div>
              <button className="screen-text-button" onClick={() => showNotice('Balances synchronized')}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            <div className="wallet-assets">
              {[
                { symbol: 'KES', name: 'Kenyan Shilling (M-Pesa)', amount: `KES ${kesBalance.toLocaleString()}`, available: `KES ${kesBalance.toLocaleString()} available`, color: '#10b981' },
                { symbol: 'USD', name: 'US Dollar', amount: '$24,320.00', available: '$24,320.00 available', color: '#3b82f6' },
                { symbol: 'BTC', name: 'Bitcoin Vault', amount: '1.284 BTC', available: '$86,656.69 available', color: '#f7931a' },
                { symbol: 'ETH', name: 'Ethereum Vault', amount: '12.48 ETH', available: '$43,952.56 available', color: '#8a92b2' },
              ].map((row) => (
                <div className="wallet-asset-row" key={row.symbol}>
                  <span className="screen-asset-badge" style={{ '--asset-color': row.color }}>
                    {row.symbol === 'BTC' ? <Bitcoin size={16} /> : row.symbol.slice(0, 1)}
                  </span>
                  <div>
                    <strong>{row.name}</strong>
                    <small>{row.available}</small>
                  </div>
                  <b>{row.amount}</b>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="panel screen-card">
            <div className="screen-section-heading">
              <div>
                <h2>Recent Transactions</h2>
                <p>Your latest M-Pesa payments</p>
              </div>
              <button className="screen-text-button" onClick={handleExportStatement}>
                Export Statement
              </button>
            </div>

            <div className="wallet-activity">
              {walletDeposits === null && !walletDepositError && <p className="screen-empty-state">Loading M-Pesa deposits…</p>}
              {walletDepositError && <p className="screen-empty-state" role="alert">{walletDepositError}</p>}
              {walletDeposits?.length === 0 && !walletDepositError && (
                <p className="screen-empty-state">No M-Pesa deposits yet.</p>
              )}
              {walletDeposits?.map((deposit, index) => {
                const completed = deposit.status === 'completed'
                const failed = deposit.status === 'failed' || deposit.status === 'expired'
                const title = completed ? 'M-Pesa deposit' : failed ? 'M-Pesa payment not completed' : 'M-Pesa payment pending'
                const detail = deposit.receipt || new Date(deposit.createdAt).toLocaleString()
                return (
                <div key={`${deposit.receipt || deposit.createdAt}-${index}`} className="wallet-act-row">
                  <span className={`activity-symbol ${completed ? 'in' : 'out'}`}>
                    {completed ? <ArrowDownLeft size={16} /> : <Clock3 size={16} />}
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </div>
                  <b className={completed ? 'positive' : failed ? 'negative' : ''}>
                    {completed ? '+' : ''}KES {deposit.amountKes.toLocaleString()}
                  </b>
                </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    )
  }

  /* =========================================================================
     5. QUANT ANALYTICS & RISK LAB
     ========================================================================= */
  if (activeNav === 'Analytics') {
    return (
      <div className="screen-content">
        <div className="screen-title-row">
          <div>
            <div className="screen-eyebrow">QUANTITATIVE LAB</div>
            <h1>Performance & Risk Analytics</h1>
            <p>Risk-adjusted metrics, drawdown monitoring, and monthly return distributions.</p>
          </div>
          <button className="screen-secondary" onClick={handleExportStatement}>
            <Download size={14} /> Export Quant Report
          </button>
        </div>

        <div className="screen-stat-grid four">
          <article className="screen-stat">
            <div className="screen-stat-top"><span>Sharpe Ratio</span><span className="screen-stat-icon"><Award size={16} /></span></div>
            <strong className="positive">2.18</strong>
            <small>Top decile risk efficiency</small>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-top"><span>Sortino Ratio</span><span className="screen-stat-icon"><ShieldCheck size={16} /></span></div>
            <strong>2.64</strong>
            <small>Downside deviation protected</small>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-top"><span>Profit Factor</span><span className="screen-stat-icon"><TrendingUp size={16} /></span></div>
            <strong className="positive">2.41</strong>
            <small>Gross wins vs gross losses</small>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-top"><span>Win Rate</span><span className="screen-stat-icon"><Check size={16} /></span></div>
            <strong>74.2%</strong>
            <small>Across 142 completed trades</small>
          </article>
        </div>

        <section className="panel screen-card">
          <div className="screen-section-heading">
            <div>
              <h2>Monthly Return Distribution (2026)</h2>
              <p>Consistent alpha generation across all market regimes</p>
            </div>
            <span className="screen-change screen-up">+18.24% YTD Alpha</span>
          </div>

          <div className="screen-bar-chart" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { m: 'Jan', v: 4.2 }, { m: 'Feb', v: 6.8 }, { m: 'Mar', v: -1.4 },
                { m: 'Apr', v: 5.1 }, { m: 'May', v: 8.4 }, { m: 'Jun', v: 3.2 },
                { m: 'Jul', v: -0.8 }, { m: 'Aug', v: 9.6 }, { m: 'Sep', v: 4.8 },
                { m: 'Oct', v: 8.2 },
              ]}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, 'Return']} />
                <Bar dataKey="v" fill="#10b981" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="screen-two-col">
          <section className="panel screen-card">
            <div className="screen-section-heading">
              <h2>Risk Heatmap & Exposure</h2>
              <span className="pro-pill">MODERATE · 34/100</span>
            </div>
            <div className="risk-detail-list">
              <div className="risk-row"><span>Value at Risk (95% 1-day)</span><b>{formatCurrency(4120, currency)}</b></div>
              <div className="risk-row"><span>Beta vs S&P 500</span><b>0.82 (Defensive)</b></div>
              <div className="risk-row"><span>Max Historical Drawdown</span><b className="negative">−3.84%</b></div>
              <div className="risk-row"><span>Annualized Volatility</span><b>14.2%</b></div>
            </div>
          </section>

          <section className="panel screen-card">
            <div className="screen-section-heading">
              <h2>Trade Execution Execution Quality</h2>
              <span className="positive">99.8% STP</span>
            </div>
            <div className="risk-detail-list">
              <div className="risk-row"><span>Average Execution Speed</span><b className="positive">12 ms</b></div>
              <div className="risk-row"><span>Slippage Index</span><b>0.001%</b></div>
              <div className="risk-row"><span>Fill Rate</span><b>100.0%</b></div>
              <div className="risk-row"><span>Trading Fees Paid</span><b className="positive">$0.00 (PRO VIP)</b></div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (activeNav === 'Profile') {
    const initials = user?.fullName?.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'TX'

    return (
      <div className="screen-content">
        <div className="screen-title-row">
          <div>
            <div className="screen-eyebrow">YOUR ACCOUNT</div>
            <h1>Profile</h1>
            <p>View your account details and manage your sign-in session.</p>
          </div>
          <button className="screen-secondary profile-signout" type="button" onClick={onSignOut}>
            <LogOut size={14} /> Sign out
          </button>
        </div>

        <section className="panel screen-card profile-card">
          <div className="profile-identity">
            <div className="profile-large-avatar" aria-hidden="true">{initials}</div>
            <div>
              <span className="profile-status"><i /> ACTIVE ACCOUNT</span>
              <h2>{user?.fullName || 'TradeX member'}</h2>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail">
              <span>EMAIL ADDRESS</span>
              <strong>{user?.email || 'Not provided'}</strong>
            </div>
            <div className="profile-detail">
              <span>MOBILE PHONE</span>
              <strong>{user?.phone || 'Not provided'}</strong>
            </div>
            <div className="profile-detail">
              <span>ACCOUNT BALANCE</span>
              <strong>KES {Number(user?.balanceKes || 0).toLocaleString()}</strong>
            </div>
            <div className="profile-detail">
              <span>ACCOUNT ID</span>
              <strong>{user?.id ? `TX-${user.id.slice(0, 8).toUpperCase()}` : 'Unavailable'}</strong>
            </div>
          </div>
        </section>

        <section className="panel screen-card profile-access-card">
          <div className="profile-access-icon"><UserRound size={18} /></div>
          <div>
            <h2>Account access</h2>
            <p>To create a different account, sign out and choose “Create free account” on the sign-in screen.</p>
          </div>
          <button className="screen-secondary profile-signout-secondary" type="button" onClick={onSignOut}>
            <LogOut size={14} /> Sign out
          </button>
        </section>
      </div>
    )
  }

  /* =========================================================================
     6. SETTINGS & VIP MEMBERSHIP
     ========================================================================= */
  return (
    <div className="screen-content">
      <div className="screen-title-row">
        <div>
          <div className="screen-eyebrow">PREFERENCES & SECURITY</div>
          <h1>Account Settings</h1>
          <p>Manage your VIP status, algorithmic API keys, global currency, and institutional security.</p>
        </div>
        <button className="screen-primary" onClick={() => showNotice('Settings saved.')}>
          <Check size={14} /> Save Preferences
        </button>
      </div>

      <div className="settings-layout">
        {/* VIP Membership Card */}
        <div className="vip-membership-card">
          <div className="vip-card-glow" />
          <div className="vip-card-top">
            <div className="vip-logo">
              <Sparkles size={16} />
              <span>TRADEX VIP</span>
            </div>
            <span className="vip-tier-badge">FOUNDER ELITE</span>
          </div>

          <div className="vip-card-mid">
            <div className="vip-member-name">{user?.fullName || 'Alex Vance (PRO)'}</div>
            <div className="vip-member-id">ID: #{user?.id?.slice(0, 8).toUpperCase() || 'TX-8924'}</div>
          </div>

          <div className="vip-card-bottom">
            <div><small>Status</small><b>Lifetime Active</b></div>
            <div><small>Maker Fee</small><b className="positive">0.00%</b></div>
            <div><small>Taker Fee</small><b className="positive">0.02%</b></div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="settings-main">
          {/* Currency & Audio Preferences */}
          <section className="panel screen-card">
            <div className="screen-section-heading">
              <div>
                <h2>Workspace & Currency Preferences</h2>
                <p>Customize your active reporting denomination and interface feedback</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <label>
                Display Currency
                <select
                  className="screen-select-dropdown"
                  value={currency}
                  onChange={(e) => {
                    setCurrency?.(e.target.value)
                    showNotice(`Display currency set to ${e.target.value}`)
                  }}
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                M-Pesa Verified Line
                <input defaultValue={user?.phone || '+254 712 345 678'} readOnly />
              </label>
            </div>
          </section>

          {/* Algorithmic API Keys */}
          <section className="panel screen-card">
            <div className="screen-section-heading">
              <div>
                <h2>Algorithmic Trading & API Keys</h2>
                <p>Deploy quantitative bots and automated strategies via WebSocket and REST APIs</p>
              </div>
              {!apiKeyGenerated ? (
                <button className="screen-primary" onClick={handleGenerateApiKey}>
                  <Key size={14} /> Generate API Key
                </button>
              ) : null}
            </div>

            {apiKeyGenerated ? (
              <div className="api-key-box">
                <div className="api-key-row">
                  <div>
                    <label>Public API Key</label>
                    <code>tx_live_9f82d1c0e7b4a58932fc4107</code>
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText('tx_live_9f82d1c0e7b4a58932fc4107')
                      setApiKeyCopied(true)
                      setTimeout(() => setApiKeyCopied(false), 2000)
                    }}
                  >
                    {apiKeyCopied ? <CheckCheck size={14} color="#10b981" /> : <Copy size={14} />}
                    {apiKeyCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="api-permissions">
                  <span className="perm-pill">READ</span>
                  <span className="perm-pill">EXECUTE</span>
                  <span className="perm-pill">IP RESTRICTED</span>
                </div>
              </div>
            ) : (
              <p className="api-empty-desc">
                No active API keys. Generate a key to connect Python, Node.js, or TradingView webhooks.
              </p>
            )}
          </section>

          {/* Security Toggles */}
          <section className="panel screen-card">
            <div className="screen-section-heading">
              <div>
                <h2>Institutional Security Controls</h2>
                <p>Enforce strict operational policies on account activity</p>
              </div>
            </div>

            <div className="settings-toggle-list">
              {Object.entries(toggles).map(([label, on]) => (
                <div className="settings-toggle-row" key={label}>
                  <div>
                    <strong>{label}</strong>
                    <small>Enterprise protection enabled</small>
                  </div>
                  <button
                    className={`screen-switch ${on ? 'on' : ''}`}
                    onClick={() => {
                      setToggles({ ...toggles, [label]: !on })
                      playAudio('click')
                    }}
                    role="switch"
                    aria-checked={on}
                  >
                    <i />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function PerformanceChart({ height = 280, currency = 'USD' }) {
  const data = Array.from({ length: 30 }, (_, i) => ({
    label: `Oct ${i + 1}`,
    value: 228000 + i * 680 + Math.sin(i * 0.5) * 1800,
  }))

  return (
    <div className="screen-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickFormatter={(v) => formatCompactCurrency(v, currency)}
          />
          <Tooltip
            formatter={(v) => [formatCurrency(v, currency), 'Net Value']}
            contentStyle={{ background: '#0f1722', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
          />
          <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#secGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
