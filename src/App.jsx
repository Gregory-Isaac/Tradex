import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowLeftRight, ArrowUpRight, BarChart3, Bitcoin,
  BriefcaseBusiness, Check, ChevronDown, Clock3, Command,
  Globe2, LifeBuoy, LogOut, Plus, Search, Sparkles,
  Volume2, VolumeX, Wallet, X, Zap, Trophy, Rocket, Flame, ArrowRight
} from 'lucide-react'
import './App.css'
import './Premium.css'
import './UltraPremium.css'
import './BetikaTheme.css'

import SectionScreens from './components/SectionScreens.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import DepositModal from './components/DepositModal.jsx'
import WithdrawModal from './components/WithdrawModal.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import TickerTape from './components/TickerTape.jsx'
import BetikaTradeslip from './components/BetikaTradeslip.jsx'
import BetikaCrashTrading from './components/BetikaCrashTrading.jsx'
import BetikaJackpotDesk from './components/BetikaJackpotDesk.jsx'
import BetikaTurboDesk from './components/BetikaTurboDesk.jsx'
import CandleChart from './components/CandleChart.jsx'

import { readApiResponse } from './api.js'
import { playAudio } from './utils/audio.js'
import { CURRENCIES, formatCurrency } from './utils/currencies.js'

// Authentic Kenyan & Global Asset Universe with Live Odds
const assets = [
  { symbol: 'BTC', pair: 'BTC / USD', name: 'Bitcoin', kind: 'crypto', price: 67482.16, change: 2.84, color: '#f7931a', oddsHigh: 1.95, oddsLow: 1.95, oddsTurbo: 2.10 },
  { symbol: 'ETH', pair: 'ETH / USD', name: 'Ethereum', kind: 'crypto', price: 3521.84, change: 1.62, color: '#8a92b2', oddsHigh: 1.92, oddsLow: 1.96, oddsTurbo: 2.05 },
  { symbol: 'SOL', pair: 'SOL / USD', name: 'Solana', kind: 'crypto', price: 182.37, change: -0.74, color: '#9c78ff', oddsHigh: 1.90, oddsLow: 1.98, oddsTurbo: 2.15 },
  { symbol: 'SCOM', pair: 'SCOM / KES', name: 'Safaricom PLC', kind: 'nse', price: 18.25, change: 2.24, color: '#00e267', oddsHigh: 2.10, oddsLow: 1.82, oddsTurbo: 2.25 },
  { symbol: 'EQTY', pair: 'EQTY / KES', name: 'Equity Group', kind: 'nse', price: 44.50, change: 1.80, color: '#a62626', oddsHigh: 1.95, oddsLow: 1.95, oddsTurbo: 2.05 },
  { symbol: 'KCB', pair: 'KCB / KES', name: 'KCB Group', kind: 'nse', price: 32.10, change: -0.45, color: '#00875a', oddsHigh: 2.25, oddsLow: 1.70, oddsTurbo: 2.30 },
  { symbol: 'EABL', pair: 'EABL / KES', name: 'East African Breweries', kind: 'nse', price: 154.00, change: 0.65, color: '#e5a50a', oddsHigh: 1.90, oddsLow: 1.90, oddsTurbo: 2.00 },
  { symbol: 'XAU', pair: 'XAU / USD', name: 'Gold Spot', kind: 'commodities', price: 2748.50, change: 0.65, color: '#ffd700', oddsHigh: 1.94, oddsLow: 1.94, oddsTurbo: 2.10 },
  { symbol: 'OIL', pair: 'BRENT / USD', name: 'Brent Crude Oil', kind: 'commodities', price: 74.80, change: -1.15, color: '#718096', oddsHigh: 1.88, oddsLow: 1.98, oddsTurbo: 2.05 },
  { symbol: 'USD/KES', pair: 'USD / KES', name: 'US Dollar / Kenyan Shilling', kind: 'forex', price: 129.50, change: -0.12, color: '#00b84c', oddsHigh: 1.95, oddsLow: 1.95, oddsTurbo: 2.10 },
  { symbol: 'EUR', pair: 'EUR / USD', name: 'Euro / US Dollar', kind: 'forex', price: 1.0842, change: -0.18, color: '#527de8', oddsHigh: 1.92, oddsLow: 1.92, oddsTurbo: 2.05 },
  { symbol: 'NVDA', pair: 'NVDA', name: 'NVIDIA Corporation', kind: 'stocks', price: 142.88, change: 4.26, color: '#8bc34a', oddsHigh: 2.05, oddsLow: 1.80, oddsTurbo: 2.20 },
  { symbol: 'AAPL', pair: 'AAPL', name: 'Apple Inc', kind: 'stocks', price: 232.91, change: 0.92, color: '#c7d2e0', oddsHigh: 1.90, oddsLow: 1.94, oddsTurbo: 2.05 },
]

const LIVE_KENYAN_WINNERS = [
  '🎉 0722***491 won KES 14,200 on BTC High (1.95x)',
  '🚀 0710***823 cashed out KES 48,000 on Aviator Rocket (3.8x)',
  '🔥 0799***115 won KES 8,500 on Safaricom (SCOM)',
  '🏆 0701***664 won KES 120,000 on Trading Jackpot',
  '💰 0745***302 won KES 22,000 on Gold Spot (1.94x)',
  '⚡ 0712***774 won KES 19,500 on 60s Fast Turbo',
  '🇰🇪 0720***339 won KES 35,000 on Equity Group EQTY',
]

function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [serviceError, setServiceError] = useState('')
  const [adminAccessOpen, setAdminAccessOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [depositRefreshKey, setDepositRefreshKey] = useState(0)

  // Navigation states: Betika tabs
  // 'Dashboard' | 'FastTrades' | 'Crash' | 'Jackpot' | 'Trade' | 'Portfolio' | 'Markets' | 'Wallet' | 'Analytics' | 'Settings' | 'Admin'
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [activeAsset, setActiveAsset] = useState(assets[0])
  const [range, setRange] = useState('1W')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All assets')
  const [notice, setNotice] = useState('')
  const [favorites] = useState(['BTC', 'SCOM', 'ETH', 'EQTY'])
  const [watchOnly] = useState(false)
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false)
  const currencyMenuRef = useRef(null)

  // Primary platform currency: KES (Kenyan Shillings) by default for Betika experience!
  const [currency, setCurrencyState] = useState(() => {
    try {
      return window.localStorage.getItem('tradex-currency') || 'KES'
    } catch {
      return 'KES'
    }
  })

  const [isAudioMuted, setIsAudioMuted] = useState(() => {
    try {
      return window.localStorage.getItem('tradex-muted') === 'true'
    } catch {
      return false
    }
  })

  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem('tradex-theme') === 'dark' ? 'dark' : 'dark'
    } catch {
      return 'dark'
    }
  })

  // =========================================================================
  // Betika Tradeslip State & Active Slips
  // =========================================================================
  const [selections, setSelections] = useState([])
  const [tradeslipOpen, setTradeslipOpen] = useState(false)
  const [activeTrades, setActiveTrades] = useState([
    {
      id: 'TX-892144',
      mode: 'single',
      selections: [{ symbol: 'BTC', name: 'Bitcoin', outcome: 'HIGH', odds: 1.95 }],
      stake: 1000,
      odds: 1.95,
      possibleWin: 1950,
      createdAt: '10:14:20',
      status: 'active',
      cashoutValue: 1250,
    },
    {
      id: 'TX-892110',
      mode: 'multi',
      selections: [
        { symbol: 'SCOM', name: 'Safaricom PLC', outcome: 'BULLISH', odds: 2.10 },
        { symbol: 'XAU', name: 'Gold Spot', outcome: 'CALL', odds: 1.94 }
      ],
      stake: 500,
      odds: 4.07,
      possibleWin: 2035,
      createdAt: '09:48:15',
      status: 'won',
      cashoutValue: 2035,
    }
  ])

  const setCurrency = useCallback((code) => {
    setCurrencyState(code)
    try {
      window.localStorage.setItem('tradex-currency', code)
    } catch (err) {
      console.error('Failed to save currency', err)
    }
  }, [])

  const toggleAudio = useCallback(() => {
    setIsAudioMuted((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem('tradex-muted', String(next))
      } catch (err) {
        console.error('Failed to save audio preference', err)
      }
      if (!next) {
        playAudio('click')
      }
      return next
    })
  }, [])

  const displayName = user?.fullName?.trim().split(/\s+/)[0] || 'Trader'
  const fullName = user?.fullName || 'TradeX Betika Pro'
  const userBalanceKes = user?.balanceKes !== undefined ? user.balanceKes : 54200

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem('tradex-theme', theme)
    } catch (error) {
      console.error('Unable to save the theme preference.', error)
    }
  }, [theme])

  const toggleTheme = () => {
    playAudio('click')
    setTheme((current) => current === 'dark' ? 'light' : 'dark')
  }

  const showNotice = useCallback((message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }, [])

  const handleDepositSuccess = useCallback((balanceKes) => {
    setUser((current) => current ? { ...current, balanceKes } : current)
    setDepositRefreshKey((current) => current + 1)
    playAudio('win')
    showNotice(`M-PESA Deposit confirmed! KES ${balanceKes.toLocaleString()} credited to treasury.`)
  }, [showNotice])

  const handleWithdrawSuccess = useCallback((balanceKes) => {
    setUser((current) => current ? { ...current, balanceKes } : current)
    setDepositRefreshKey((current) => current + 1)
    playAudio('cashout')
    showNotice(`M-PESA Withdrawal processed to your mobile number.`)
  }, [showNotice])

  const handleUpdateBalance = (deltaKes) => {
    setUser((current) => {
      const oldBal = current?.balanceKes !== undefined ? current.balanceKes : 54200
      const newBal = Math.max(0, oldBal + deltaKes)
      return current ? { ...current, balanceKes: newBal } : { balanceKes: newBal }
    })
  }

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close currency menu when clicking outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(e.target)) {
        setCurrencyMenuOpen(false)
      }
    }
    if (currencyMenuOpen) {
      document.addEventListener('click', handleDocClick)
    }
    return () => document.removeEventListener('click', handleDocClick)
  }, [currencyMenuOpen])

  useEffect(() => {
    let active = true

    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 401) return null
        const data = await readApiResponse(response)
        if (!response.ok) throw new Error(data.error || 'Unable to check your sign-in status.')
        return data.user
      })
      .then((account) => {
        if (active && account) setUser(account)
      })
      .catch((error) => {
        if (active) setServiceError(error.message || 'Could not reach the TradeX server. Start the app with npm run dev.')
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })

    return () => {
      active = false
    }
  }, [])

  // =========================================================================
  // Betika Odds Click Handler (Adds / Toggles selection in Tradeslip)
  // =========================================================================
  const handleSelectOdds = (asset, outcome, odds, marketName = 'Market Outcome') => {
    playAudio('click')
    setSelections((prev) => {
      const exists = prev.find((s) => s.symbol === asset.symbol && s.outcome === outcome)
      if (exists) {
        // Deselect
        return prev.filter((s) => !(s.symbol === asset.symbol && s.outcome === outcome))
      }
      // Add or replace for same asset in single mode
      const filtered = prev.filter((s) => s.symbol !== asset.symbol)
      return [
        ...filtered,
        {
          id: `${asset.symbol}-${outcome}-${Date.now()}`,
          symbol: asset.symbol,
          name: asset.name,
          outcome,
          odds,
          marketName,
        }
      ]
    })
    showNotice(`Added ${asset.symbol} (${outcome} @ ${odds}x) to Tradeslip`)
  }

  const handlePlaceTrade = (newTrade) => {
    handleUpdateBalance(-newTrade.stake)
    setActiveTrades((prev) => [newTrade, ...prev])
    playAudio('win')
    showNotice(`🎉 Trade placed for ${currency} ${newTrade.stake.toLocaleString()}! Potential Win: ${currency} ${newTrade.possibleWin.toLocaleString()}`)
  }

  const handleCashoutTrade = (trade) => {
    const cashValue = Number(trade.cashoutValue || trade.stake * 0.95)
    handleUpdateBalance(cashValue)
    setActiveTrades((prev) =>
      prev.map((t) => (t.id === trade.id ? { ...t, status: 'cashed_out' } : t))
    )
    playAudio('cashout')
    showNotice(`💰 Cashout settled! ${currency} ${cashValue.toLocaleString()} returned to your balance.`)
  }

  const filteredAssets = useMemo(() => assets.filter((asset) => {
    const categoryMatch =
      filter === 'All assets' ||
      (filter === 'NSE Kenya' && asset.kind === 'nse') ||
      (filter === 'Crypto' && asset.kind === 'crypto') ||
      (filter === 'Forex' && asset.kind === 'forex') ||
      (filter === 'Commodities' && asset.kind === 'commodities')
    const searchMatch = `${asset.name} ${asset.symbol} ${asset.pair}`.toLowerCase().includes(search.toLowerCase())
    return categoryMatch && searchMatch && (!watchOnly || favorites.includes(asset.symbol))
  }), [filter, search, watchOnly, favorites])

  const handleSignOut = async () => {
    playAudio('click')
    const response = await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
    if (!response.ok) throw new Error('Unable to sign out. Please try again.')
    setUser(null)
    setActiveNav('Dashboard')
  }

  // Auth Loading state
  if (checkingSession) {
    return (
      <main className="auth-loading" aria-label="Checking your session">
        <span className="auth-loading-mark"><Activity size={22} className="spin-slow" /></span>
        <div className="auth-loading-copy">
          <strong>TRADEX BETIKA PRO</strong>
          <span>Connecting to Safaricom Daraja M-PESA & Trading Liquidity...</span>
        </div>
      </main>
    )
  }

  // Not signed in
  if (!user) {
    if (adminAccessOpen) {
      return (
        <div className="terminal" data-theme={theme}>
          <AdminPanel onBack={() => setAdminAccessOpen(false)} />
        </div>
      )
    }
    return (
      <AuthScreen
        onAuthenticated={(account) => {
          setUser(account)
          setServiceError('')
        }}
        onAdminAccess={() => setAdminAccessOpen(true)}
        serviceError={serviceError}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  const currentCurr = CURRENCIES[currency] || CURRENCIES.KES
  const activeRateLabel = currency === 'USD' ? 'USD 1.00' : `1 USD ≈ ${currentCurr.symbol}${currentCurr.rate}`

  return (
    <div className="terminal" data-theme={theme}>
      {/* =====================================================================
          1. BETIKA TOP TICKER & ANNOUNCEMENT STRIP
          ===================================================================== */}
      <div className="betika-top-ribbon">
        <div className="ticker-track">
          <span className="betika-mpesa-tag">
            <Zap size={12} /> M-PESA PAYBILL 290290 · 0% WITHDRAWAL TAX PROMO
          </span>
          <span style={{ color: 'var(--b-border)' }}>|</span>
          {LIVE_KENYAN_WINNERS.map((w, i) => (
            <span key={i} className="betika-win-item">
              <span className="betika-win-badge">LIVE WIN</span>
              <span>{w}</span>
            </span>
          ))}
        </div>

        <div className="betika-top-ribbon-right">
          <span style={{ color: 'var(--b-green)', fontWeight: 800 }}>
            🇰🇪 NAIROBI {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT
          </span>
          <span>STP LATENCY: 0.8ms</span>
        </div>
      </div>

      {/* =====================================================================
          2. BETIKA MASTER HEADER BAR
          ===================================================================== */}
      <header className="betika-header">
        <div className="betika-header-left">
          {/* Betika Brand Logo */}
          <div className="betika-logo-box" onClick={() => setActiveNav('Dashboard')}>
            <div className="betika-logo-icon">
              <Zap size={22} fill="currentColor" />
            </div>
            <div className="betika-logo-text">
              <span className="betika-brand-name">
                TRADE<span>X</span>
              </span>
              <span className="betika-brand-tagline">BETIKA-PRO EDITION</span>
            </div>
          </div>

          {/* Quick Search */}
          <button
            className="global-search-btn"
            style={{ width: 260, height: 38 }}
            onClick={() => {
              playAudio('click')
              setCmdOpen(true)
            }}
            title="Search markets (Ctrl+K)"
          >
            <Search size={14} />
            <span>Search markets, NSE stocks...</span>
            <kbd><Command size={10} /> K</kbd>
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="betika-header-right">
          {/* M-PESA Treasury Balance Pill */}
          <div
            className="betika-balance-pill"
            onClick={() => {
              playAudio('click')
              setDepositOpen(true)
            }}
            title="Click to Deposit via M-PESA"
          >
            <span className="betika-balance-label">
              <Wallet size={11} /> M-PESA BALANCE
            </span>
            <span className="betika-balance-val">
              {currency} {Number(userBalanceKes).toLocaleString()}
            </span>
          </div>

          {/* Glowing Betika Deposit Button */}
          <button
            className="betika-deposit-btn"
            onClick={() => {
              playAudio('click')
              setDepositOpen(true)
            }}
          >
            <Plus size={15} strokeWidth={3} /> DEPOSIT
          </button>

          {/* Withdraw Button */}
          <button
            className="betika-withdraw-btn"
            onClick={() => {
              playAudio('click')
              setWithdrawOpen(true)
            }}
          >
            <ArrowUpRight size={14} /> WITHDRAW
          </button>

          {/* Currency Switcher */}
          <div className="currency-selector-wrap" ref={currencyMenuRef}>
            <button
              className="account-switch"
              onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)}
              title={`Selected: ${currentCurr.name} (${activeRateLabel})`}
              style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--b-border)' }}
            >
              <span className="currency-flag">{currentCurr.flag}</span>
              <span className="currency-code">{currency}</span>
              <ChevronDown size={13} />
            </button>

            {currencyMenuOpen && (
              <div className="currency-dropdown-card">
                <div className="currency-dropdown-title">Select Currency</div>
                {Object.values(CURRENCIES).map((c) => (
                  <button
                    key={c.code}
                    className={`currency-option-row ${c.code === currency ? 'selected' : ''}`}
                    onClick={() => {
                      setCurrency(c.code)
                      setCurrencyMenuOpen(false)
                      playAudio('click')
                      showNotice(`Currency set to ${c.name} (${c.code})`)
                    }}
                  >
                    <span className="curr-flag">{c.flag}</span>
                    <div className="curr-copy">
                      <strong>{c.name} ({c.code})</strong>
                      <small>{c.code === 'USD' ? '1.00 USD' : `1 USD = ${c.symbol}${c.rate}`}</small>
                    </div>
                    {c.code === currency && <Check size={14} className="curr-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Betslip Toggle on Header (shows badge of selections) */}
          <button
            className="betika-slip-toggle-btn"
            onClick={() => {
              playAudio('click')
              setTradeslipOpen(!tradeslipOpen)
            }}
          >
            TRADESLIP
            <span className="betika-slip-badge">{selections.length}</span>
          </button>

          {/* Audio toggle */}
          <button
            className={`icon-button audio-toggle ${isAudioMuted ? 'is-muted' : ''}`}
            onClick={toggleAudio}
            title={isAudioMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isAudioMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          {/* User Profile Mini */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              cursor: 'pointer'
            }}
            onClick={() => setActiveNav('Profile')}
          >
            <div className="workspace-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
              {fullName.slice(0, 1).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{displayName}</span>
          </div>

          <button
            className="icon-button"
            onClick={() => handleSignOut().catch((error) => showNotice(error.message))}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* =====================================================================
          3. BETIKA HORIZONTAL CATEGORY NAVIGATION STRIP
          ===================================================================== */}
      <nav className="betika-nav-strip">
        <button
          className={`betika-nav-tab ${activeNav === 'Dashboard' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Dashboard')
          }}
        >
          <Zap size={14} /> LIVE MARKETS
          <span className="betika-tab-badge">LIVE</span>
        </button>

        <button
          className={`betika-nav-tab ${activeNav === 'FastTrades' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('FastTrades')
          }}
        >
          <Clock3 size={14} /> 60s FAST TURBO
          <span className="betika-tab-badge yellow">HOT</span>
        </button>

        <button
          className={`betika-nav-tab ${activeNav === 'Crash' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Crash')
          }}
        >
          <Rocket size={14} /> CRASH MULTIPLIER (AVIATOR)
          <span className="betika-tab-badge green">100X</span>
        </button>

        <button
          className={`betika-nav-tab ${activeNav === 'Jackpot' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Jackpot')
          }}
        >
          <Trophy size={14} /> KES 10M GRAND JACKPOT
          <span className="betika-tab-badge yellow">KES 10M</span>
        </button>

        <button
          className={`betika-nav-tab ${activeNav === 'Trade' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Trade')
          }}
        >
          <ArrowLeftRight size={14} /> PRO TRADING DESK
          <span className="betika-tab-badge green">0.0% FEE</span>
        </button>

        <button
          className={`betika-nav-tab ${activeNav === 'Portfolio' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Portfolio')
          }}
        >
          <BriefcaseBusiness size={14} /> MY PORTFOLIO
        </button>

        <button
          className={`betika-nav-tab ${activeNav === 'Wallet' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Wallet')
          }}
        >
          <Wallet size={14} /> WALLET / M-PESA
        </button>

        <button
          className={`betika-nav-tab ${activeNav === 'Analytics' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Analytics')
          }}
        >
          <BarChart3 size={14} /> ANALYTICS
        </button>
      </nav>

      {/* Real-time Ticker Ribbon */}
      <TickerTape
        onSelectSymbol={(sym) => {
          const found = assets.find((a) => a.symbol === sym)
          if (found) {
            setActiveAsset(found)
            setActiveNav('Trade')
          }
        }}
        currency={currency}
      />

      {/* =====================================================================
          4. MASTER 3-COLUMN BETIKA TRADING PLATFORM LAYOUT
          ===================================================================== */}
      <div className="betika-layout">
        {/* Left Sidebar: Market Categories & Quick Leagues */}
        <aside className="betika-sidebar-left">
          <div className="betika-side-group-title">MARKET CATEGORIES</div>

          <button
            className={`betika-side-link ${filter === 'All assets' ? 'active' : ''}`}
            onClick={() => {
              playAudio('click')
              setFilter('All assets')
              if (activeNav !== 'Dashboard') setActiveNav('Dashboard')
            }}
          >
            <span className="side-icon-box">
              <Zap size={15} style={{ color: 'var(--b-yellow)' }} /> All Assets
            </span>
            <span className="betika-side-count">{assets.length}</span>
          </button>

          <button
            className={`betika-side-link ${filter === 'NSE Kenya' ? 'active' : ''}`}
            onClick={() => {
              playAudio('click')
              setFilter('NSE Kenya')
              if (activeNav !== 'Dashboard') setActiveNav('Dashboard')
            }}
          >
            <span className="side-icon-box">
              <span style={{ fontSize: 13 }}>🇰🇪</span> NSE Kenya Bluechips
            </span>
            <span className="betika-side-count">4</span>
          </button>

          <button
            className={`betika-side-link ${filter === 'Crypto' ? 'active' : ''}`}
            onClick={() => {
              playAudio('click')
              setFilter('Crypto')
              if (activeNav !== 'Dashboard') setActiveNav('Dashboard')
            }}
          >
            <span className="side-icon-box">
              <Bitcoin size={15} style={{ color: '#f7931a' }} /> Crypto Perpetuals
            </span>
            <span className="betika-side-count">3</span>
          </button>

          <button
            className={`betika-side-link ${filter === 'Forex' ? 'active' : ''}`}
            onClick={() => {
              playAudio('click')
              setFilter('Forex')
              if (activeNav !== 'Dashboard') setActiveNav('Dashboard')
            }}
          >
            <span className="side-icon-box">
              <Globe2 size={15} style={{ color: '#00a6ff' }} /> Forex & USD/KES
            </span>
            <span className="betika-side-count">2</span>
          </button>

          <button
            className={`betika-side-link ${filter === 'Commodities' ? 'active' : ''}`}
            onClick={() => {
              playAudio('click')
              setFilter('Commodities')
              if (activeNav !== 'Dashboard') setActiveNav('Dashboard')
            }}
          >
            <span className="side-icon-box">
              <Flame size={15} style={{ color: 'var(--b-yellow)' }} /> Gold & Crude Oil
            </span>
            <span className="betika-side-count">2</span>
          </button>

          {/* Betika KES 10M Jackpot Promo Card */}
          <div className="betika-jackpot-banner-card">
            <span className="betika-jackpot-badge">KES 10,000,000</span>
            <h4>Daily Grand Jackpot</h4>
            <p>Predict 5 asset trends to win KES 10M with a KES 50 ticket.</p>
            <button
              className="betika-jackpot-play-btn"
              onClick={() => {
                playAudio('click')
                setActiveNav('Jackpot')
              }}
            >
              PLAY FOR KES 50 <ArrowRight size={13} />
            </button>
          </div>

          {/* Priority Watchlist Assets */}
          <div className="betika-side-group-title" style={{ marginTop: 10 }}>
            PRIORITY ASSETS
          </div>
          {assets.slice(0, 4).map((asset) => (
            <button
              key={asset.symbol}
              className={`betika-side-link ${activeAsset.symbol === asset.symbol ? 'active' : ''}`}
              onClick={() => {
                playAudio('click')
                setActiveAsset(asset)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800 }}>{asset.symbol}</span>
                <small style={{ color: 'var(--b-text-sub)' }}>{asset.pair}</small>
              </div>
              <span className={asset.change >= 0 ? 'betika-asset-change up' : 'betika-asset-change down'}>
                {asset.change >= 0 ? '+' : ''}{asset.change}%
              </span>
            </button>
          ))}

          {/* Support */}
          <div style={{ marginTop: 'auto', padding: 8 }}>
            <button
              className="screen-secondary"
              style={{ width: '100%', padding: 9, fontSize: 12, justifyContent: 'center' }}
              onClick={() => showNotice('M-PESA Priority Desk is 24/7 active.')}
            >
              <LifeBuoy size={14} /> M-PESA VIP SUPPORT
            </button>
          </div>
        </aside>

        {/* =====================================================================
            Center Arena: Dynamic Content based on Active Nav
            ===================================================================== */}
        <main className="betika-arena">
          {activeNav === 'Crash' ? (
            <BetikaCrashTrading
              userBalance={userBalanceKes}
              onUpdateBalance={handleUpdateBalance}
              currency={currency}
              showNotice={showNotice}
            />
          ) : activeNav === 'Jackpot' ? (
            <BetikaJackpotDesk
              userBalance={userBalanceKes}
              onUpdateBalance={handleUpdateBalance}
              currency={currency}
              showNotice={showNotice}
            />
          ) : activeNav === 'FastTrades' ? (
            <BetikaTurboDesk
              activeAsset={activeAsset}
              userBalance={userBalanceKes}
              onUpdateBalance={handleUpdateBalance}
              currency={currency}
              showNotice={showNotice}
            />
          ) : activeNav === 'Dashboard' ? (
            <>
              {/* Betika Hero Promotional Banner */}
              <div className="betika-promo-banner">
                <div className="betika-promo-left">
                  <div className="betika-promo-kicker">
                    <Trophy size={13} /> OFFICIAL TRADEX GRAND JACKPOT · KENYA
                  </div>
                  <h1 className="betika-promo-title">
                    PREDICT & WIN <span>KES 10,000,000</span> GRAND PRIZE
                  </h1>
                  <p className="betika-promo-desc">
                    Trade Bitcoin, Safaricom (SCOM), and Gold Spot with <b>instant M-PESA deposits</b>, zero Maker fees, and sub-second execution!
                  </p>
                  <div className="betika-promo-actions">
                    <button
                      className="betika-promo-primary"
                      onClick={() => {
                        playAudio('click')
                        setActiveNav('Jackpot')
                      }}
                    >
                      <Trophy size={15} /> ENTER JACKPOT (KES 50)
                    </button>
                    <button
                      className="betika-promo-secondary"
                      onClick={() => {
                        playAudio('click')
                        setActiveNav('FastTrades')
                      }}
                    >
                      <Clock3 size={15} /> 60s FAST TURBO
                    </button>
                    <button
                      className="betika-promo-secondary"
                      onClick={() => {
                        playAudio('click')
                        setActiveNav('Crash')
                      }}
                    >
                      <Rocket size={15} /> CRASH MULTIPLIER
                    </button>
                  </div>
                </div>

                <div className="betika-promo-right">
                  <div className="betika-jackpot-huge-sub">JACKPOT POT</div>
                  <div className="betika-jackpot-huge-pot">KES 10,000,000</div>
                  <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>
                    CLOSES TODAY AT 22:00 EAT
                  </div>
                </div>
              </div>

              {/* Betika Live Odds Market List Card */}
              <div className="betika-market-list-card">
                <div className="betika-market-header">
                  <div className="betika-market-title-wrap">
                    <span className="betika-market-title">LIVE TRADING MARKETS</span>
                    <span className="betika-tab-badge">● STREAMING</span>
                  </div>

                  {/* Filter Pills & Quick Search */}
                  <div className="betika-filter-pills">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--b-border)', borderRadius: 6, padding: '3px 8px' }}>
                      <Search size={12} style={{ color: 'var(--b-text-sub)' }} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search assets..."
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 11, outline: 'none', width: 110 }}
                      />
                      {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--b-text-sub)', cursor: 'pointer', padding: 0 }}>
                          <X size={11} />
                        </button>
                      )}
                    </div>
                    {['All assets', 'NSE Kenya', 'Crypto', 'Forex', 'Commodities'].map((cat) => (
                      <button
                        key={cat}
                        className={`betika-filter-pill ${filter === cat ? 'active' : ''}`}
                        onClick={() => {
                          playAudio('click')
                          setFilter(cat)
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match / Asset Rows with Betika-style Clickable Odds Buttons */}
                <div>
                  {filteredAssets.map((asset) => {
                    const isHighSelected = selections.some((s) => s.symbol === asset.symbol && s.outcome === 'HIGH')
                    const isLowSelected = selections.some((s) => s.symbol === asset.symbol && s.outcome === 'LOW')
                    const isTurboSelected = selections.some((s) => s.symbol === asset.symbol && s.outcome === 'TURBO')

                    return (
                      <div key={asset.symbol} className="betika-trade-row">
                        {/* Asset Left Info */}
                        <div
                          className="betika-asset-info"
                          onClick={() => {
                            setActiveAsset(asset)
                            setActiveNav('Trade')
                          }}
                        >
                          <div className="betika-asset-icon" style={{ backgroundColor: asset.color }}>
                            {asset.symbol === 'BTC' ? <Bitcoin size={18} /> : asset.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="betika-asset-names">
                              <strong>{asset.pair}</strong>
                              <span>{asset.name}</span>
                            </div>
                            <div className="betika-asset-price-box">
                              <span className="betika-asset-price">
                                {formatCurrency(asset.price, currency, asset.price < 10 ? 4 : 2)}
                              </span>
                              <span className={asset.change >= 0 ? 'betika-asset-change up' : 'betika-asset-change down'}>
                                {asset.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {asset.change >= 0 ? '+' : ''}{asset.change}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Betika 3-Way Clickable Odds Matrix */}
                        <div className="betika-odds-grid">
                          <button
                            className={`betika-odd-btn ${isHighSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectOdds(asset, 'HIGH', asset.oddsHigh || 1.95, 'Next 60s Close: High')}
                            title={`Click to add ${asset.symbol} High @ ${asset.oddsHigh || 1.95}x to Tradeslip`}
                          >
                            <span className="odd-label">HIGH / CALL</span>
                            <span className="odd-val">{asset.oddsHigh || 1.95}x</span>
                          </button>

                          <button
                            className={`betika-odd-btn ${isLowSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectOdds(asset, 'LOW', asset.oddsLow || 1.95, 'Next 60s Close: Low')}
                            title={`Click to add ${asset.symbol} Low @ ${asset.oddsLow || 1.95}x to Tradeslip`}
                          >
                            <span className="odd-label">LOW / PUT</span>
                            <span className="odd-val">{asset.oddsLow || 1.95}x</span>
                          </button>

                          <button
                            className={`betika-odd-btn ${isTurboSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectOdds(asset, 'TURBO', asset.oddsTurbo || 2.10, '60s Turbo Strike')}
                            title={`Click to add ${asset.symbol} 60s Turbo @ ${asset.oddsTurbo || 2.10}x to Tradeslip`}
                          >
                            <span className="odd-label">60s TURBO</span>
                            <span className="odd-val">{asset.oddsTurbo || 2.10}x</span>
                          </button>
                        </div>

                        {/* Chart Action */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className="betika-view-chart-btn"
                            onClick={() => {
                              playAudio('click')
                              setActiveAsset(asset)
                              setActiveNav('Trade')
                            }}
                          >
                            <BarChart3 size={14} /> Pro Chart
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Live Candlestick Preview */}
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>
                    {activeAsset.pair} LIVE PRO CHART
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--b-green)', fontWeight: 800 }}>
                    ● 1.2ms STP Liquidity Feed
                  </span>
                </div>
                <div style={{ background: 'var(--b-bg-surface)', border: '1px solid var(--b-border)', borderRadius: 12, padding: 14 }}>
                  <CandleChart
                    asset={activeAsset}
                    range={range}
                    onRangeChange={setRange}
                    currency={currency}
                  />
                </div>
              </div>
            </>
          ) : (
            <SectionScreens
              user={user}
              depositRefreshKey={depositRefreshKey}
              onOpenDeposit={() => {
                playAudio('click')
                setDepositOpen(true)
              }}
              onOpenWithdraw={() => {
                playAudio('click')
                setWithdrawOpen(true)
              }}
              currency={currency}
              setCurrency={setCurrency}
              onSignOut={() => handleSignOut().catch((error) => showNotice(error.message))}
              activeNav={activeNav}
              assets={assets}
              activeAsset={activeAsset}
              setActiveAsset={setActiveAsset}
              showNotice={showNotice}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
        </main>

        {/* =====================================================================
            Right Column: The Iconic Betika TRADESLIP
            ===================================================================== */}
        <BetikaTradeslip
          selections={selections}
          onRemoveSelection={(sel) => setSelections((prev) => prev.filter((s) => s.id !== sel.id))}
          onClearSelections={() => setSelections([])}
          onPlaceTrade={handlePlaceTrade}
          activeTrades={activeTrades}
          onCashout={handleCashoutTrade}
          currency={currency}
          userBalance={userBalanceKes}
          isOpen={true}
        />
      </div>

      {/* =====================================================================
          5. MOBILE BOTTOM NAVIGATION BAR
          ===================================================================== */}
      <nav className="betika-mobile-bottom-bar">
        <button
          className={`betika-mobile-bottom-item ${activeNav === 'Dashboard' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Dashboard')
          }}
        >
          <Zap size={18} />
          <span>Markets</span>
        </button>

        <button
          className={`betika-mobile-bottom-item ${activeNav === 'FastTrades' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('FastTrades')
          }}
        >
          <Clock3 size={18} />
          <span>60s Turbo</span>
        </button>

        <button
          className={`betika-mobile-bottom-item ${activeNav === 'Crash' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Crash')
          }}
        >
          <Rocket size={18} />
          <span>Crash</span>
        </button>

        <button
          className={`betika-mobile-bottom-item ${activeNav === 'Jackpot' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Jackpot')
          }}
        >
          <Trophy size={18} />
          <span>Jackpot</span>
        </button>

        <button
          className="betika-mobile-bottom-item"
          onClick={() => {
            playAudio('click')
            setTradeslipOpen(true)
          }}
        >
          <div style={{ position: 'relative' }}>
            <Activity size={18} />
            {selections.length > 0 && (
              <span style={{
                position: 'absolute',
                top: -6,
                right: -8,
                background: 'var(--b-yellow)',
                color: '#060b08',
                borderRadius: 8,
                fontSize: 9,
                fontWeight: 900,
                padding: '1px 4px',
              }}>
                {selections.length}
              </span>
            )}
          </div>
          <span>Slip</span>
        </button>

        <button
          className={`betika-mobile-bottom-item ${activeNav === 'Wallet' ? 'active' : ''}`}
          onClick={() => {
            playAudio('click')
            setActiveNav('Wallet')
          }}
        >
          <Wallet size={18} />
          <span>Wallet</span>
        </button>
      </nav>

      {/* =====================================================================
          Modals & Overlays
          ===================================================================== */}
      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        user={user}
        onDepositSuccess={handleDepositSuccess}
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        user={user}
        onWithdrawSuccess={handleWithdrawSuccess}
      />

      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={(nav) => {
          setActiveNav(nav)
          setCmdOpen(false)
        }}
        onSelectAsset={(sym) => {
          const a = assets.find((x) => x.symbol === sym)
          if (a) {
            setActiveAsset(a)
            setActiveNav('Trade')
          }
        }}
        onOpenDeposit={() => {
          setCmdOpen(false)
          setDepositOpen(true)
        }}
        onOpenWithdraw={() => {
          setCmdOpen(false)
          setWithdrawOpen(true)
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleAudio={toggleAudio}
        isAudioMuted={isAudioMuted}
      />

      {notice && (
        <div className="toast-message" role="alert" style={{ background: '#0a1610', borderColor: 'var(--b-yellow)' }}>
          <Sparkles size={16} style={{ color: 'var(--b-yellow)' }} />
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export default App
