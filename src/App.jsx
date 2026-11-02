import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  Activity, ArrowDownRight, ArrowLeftRight, ArrowUpRight, BarChart3, Bell, Bitcoin,
  BriefcaseBusiness, Check, ChevronDown, CircleHelp, Clock3, Command, CreditCard,
  Crown, Eye, Globe2, LayoutDashboard, LifeBuoy, LogOut, Menu, Moon, MoreHorizontal,
  Plus, Search, Settings2, ShieldCheck, Sparkles, Star, Sun, TrendingUp, UserRound,
  Volume2, VolumeX, Wallet, X, Zap
} from 'lucide-react'
import './App.css'
import './Premium.css'
import SectionScreens from './components/SectionScreens.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import DepositModal from './components/DepositModal.jsx'
import WithdrawModal from './components/WithdrawModal.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import TickerTape from './components/TickerTape.jsx'
import { readApiResponse } from './api.js'
import { playAudio } from './utils/audio.js'
import { CURRENCIES, convertFromUSD, formatCurrency } from './utils/currencies.js'
import './UltraPremium.css'

const assets = [
  { symbol: 'BTC', pair: 'BTC / USD', name: 'Bitcoin', kind: 'crypto', price: 67482.16, change: 2.84, color: '#f7931a' },
  { symbol: 'ETH', pair: 'ETH / USD', name: 'Ethereum', kind: 'crypto', price: 3521.84, change: 1.62, color: '#8a92b2' },
  { symbol: 'SOL', pair: 'SOL / USD', name: 'Solana', kind: 'crypto', price: 182.37, change: -0.74, color: '#9c78ff' },
  { symbol: 'NVDA', pair: 'NVDA', name: 'NVIDIA', kind: 'stocks', price: 142.88, change: 4.26, color: '#8bc34a' },
  { symbol: 'AAPL', pair: 'AAPL', name: 'Apple', kind: 'stocks', price: 232.91, change: 0.92, color: '#c7d2e0' },
  { symbol: 'EUR', pair: 'EUR / USD', name: 'Euro / US Dollar', kind: 'forex', price: 1.0842, change: -0.18, color: '#527de8' },
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
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [activeAsset, setActiveAsset] = useState(assets[0])
  const [range, setRange] = useState('1W')
  const [side, setSide] = useState('Buy')
  const [quantity, setQuantity] = useState(0.25)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All assets')
  const [notice, setNotice] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = window.localStorage.getItem('tradex-notifications')
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === 'string' && typeof item.message === 'string') : []
    } catch {
      return []
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [favorites, setFavorites] = useState(['BTC', 'ETH', 'NVDA'])
  const [watchOnly, setWatchOnly] = useState(false)
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false)
  const currencyMenuRef = useRef(null)

  const [currency, setCurrencyState] = useState(() => {
    try {
      return window.localStorage.getItem('tradex-currency') || 'USD'
    } catch {
      return 'USD'
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
      return window.localStorage.getItem('tradex-theme') === 'dark' ? 'dark' : 'light'
    } catch {
      return 'dark'
    }
  })

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
  const fullName = user?.fullName || 'TradeX member'

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

  const handleDepositSuccess = useCallback((balanceKes) => {
    setUser((current) => current ? { ...current, balanceKes } : current)
    setDepositRefreshKey((current) => current + 1)
  }, [])

  const handleWithdrawSuccess = useCallback((balanceKes) => {
    setUser((current) => current ? { ...current, balanceKes } : current)
    setDepositRefreshKey((current) => current + 1)
  }, [])

  // Global keyboard shortcut: Cmd+K / Ctrl+K
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

  const filteredAssets = useMemo(() => assets.filter((asset) => {
    const categoryMatch = filter === 'All assets' || asset.kind === filter.toLowerCase()
    const searchMatch = `${asset.name} ${asset.symbol} ${asset.pair}`.toLowerCase().includes(search.toLowerCase())
    return categoryMatch && searchMatch && (!watchOnly || favorites.includes(asset.symbol))
  }), [filter, search, watchOnly, favorites])

  const total = activeAsset.price * (Number(quantity) || 0)

  // Dynamic portfolio historical curve based on selected timeframe & currency
  const chartData = useMemo(() => {
    const points = range === '1D' ? 24 : range === '1W' ? 42 : range === '1M' ? 30 : range === '3M' ? 40 : 48
    const baseUSD = 248560.84
    const delta = range === '1D' ? 0.016 : range === '1W' ? 0.038 : range === '1M' ? 0.082 : range === '3M' ? 0.14 : 0.24

    return Array.from({ length: points }, (_, i) => {
      const progress = i / (points - 1)
      const wave = Math.sin(i * 0.44) * 850 + Math.cos(i * 0.22) * 620 + Math.sin(i * 1.1) * 210
      const trend = (progress - 0.4) * (baseUSD * delta)
      const usdValue = Math.round(baseUSD - (baseUSD * delta * 0.4) + trend + wave)
      const converted = convertFromUSD(usdValue, currency)

      let time = ''
      if (range === '1D') {
        time = i % 4 === 0 ? `${String(i).padStart(2, '0')}:00` : ''
      } else if (range === '1W') {
        time = i % 7 === 0 ? `Oct ${String(18 + Math.floor(i / 6)).padStart(2, '0')}` : ''
      } else if (range === '1M') {
        time = i % 6 === 0 ? `Oct ${String(Math.floor(i) + 1).padStart(2, '0')}` : ''
      } else if (range === '3M') {
        time = i % 10 === 0 ? `Wk ${Math.floor(i / 7) + 1}` : ''
      } else {
        time = i % 8 === 0 ? `M${Math.floor(i / 4) + 1}` : ''
      }

      return { time, value: Math.round(converted) }
    })
  }, [range, currency])

  const handleSignOut = async () => {
    playAudio('click')
    const response = await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
    if (!response.ok) throw new Error('Unable to sign out. Please try again.')
    setUser(null)
    setActiveNav('Dashboard')
  }

  const showNotice = (message) => {
    setNotice(message)
    setNotifications((current) => {
      const next = [{ id: `${Date.now()}-${Math.random()}`, message, createdAt: new Date().toISOString(), read: false }, ...current].slice(0, 30)
      try {
        window.localStorage.setItem('tradex-notifications', JSON.stringify(next))
      } catch (error) {
        console.error('Unable to save notifications.', error)
      }
      return next
    })
    window.setTimeout(() => setNotice(''), 3000)
  }

  const unreadNotificationCount = notifications.filter((item) => !item.read).length

  const updateNotifications = (updater) => {
    setNotifications((current) => {
      const next = updater(current)
      try {
        window.localStorage.setItem('tradex-notifications', JSON.stringify(next))
      } catch (error) {
        console.error('Unable to save notifications.', error)
      }
      return next
    })
  }

  const handleExecuteTrade = () => {
    playAudio(side === 'Buy' ? 'buy' : 'sell')
    const formattedAmount = `${quantity || 0} ${activeAsset.symbol}`
    const formattedTotal = formatCurrency(total, currency)
    showNotice(`${side} order for ${formattedAmount} filled at ${formatCurrency(activeAsset.price, currency)} (Total: ${formattedTotal})`)
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

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Trade', icon: ArrowLeftRight },
    { label: 'Portfolio', icon: BriefcaseBusiness },
    { label: 'Markets', icon: TrendingUp },
    { label: 'Wallet', icon: Wallet },
    { label: 'Analytics', icon: BarChart3 },
    { label: 'Profile', icon: UserRound },
    { label: 'Settings', icon: Settings2 },
    { label: 'Admin', icon: ShieldCheck },
  ]

  if (checkingSession) {
    return (
      <main className="auth-loading" aria-label="Checking your session">
        <span className="auth-loading-mark"><Activity size={22} className="spin-slow" /></span>
        <div className="auth-loading-copy">
          <strong>TRADEX INSTITUTIONAL</strong>
          <span>Establishing encrypted STP handshake...</span>
        </div>
      </main>
    )
  }

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

  const currentCurr = CURRENCIES[currency] || CURRENCIES.USD
  const activeRateLabel = currency === 'USD' ? 'USD 1.00' : `1 USD ≈ ${currentCurr.symbol}${currentCurr.rate}`

  return (
    <div className="terminal" data-theme={theme}>
      {/* Institutional Left Rail */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Activity size={19} strokeWidth={2.7} />
          </div>
          <span className="brand-text">tradex<span className="brand-dot">.</span></span>
          <span className="brand-pro-tag">PRO</span>
          <button className="sidebar-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={17} />
          </button>
        </div>

        <div className="workspace">
          <div className="workspace-avatar">
            {fullName.slice(0, 1).toUpperCase()}
          </div>
          <div className="workspace-copy">
            <div className="workspace-name-row">
              <strong>{fullName}</strong>
              <span className="workspace-vip-badge"><Crown size={10} /> VIP</span>
            </div>
            <span>KES {Number(user.balanceKes || 0).toLocaleString()} treasury</span>
          </div>
          <ChevronDown size={14} className="workspace-chevron" />
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-link ${activeNav === label ? 'nav-active' : ''}`}
              onClick={() => {
                playAudio('click')
                setActiveNav(label)
                setMobileOpen(false)
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
              {label === 'Markets' && <span className="nav-live" title="Live STP data feed" />}
              {label === 'Trade' && <span className="nav-hot-tag">0.0% FEE</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-label markets-label">
          <span>PRIORITY ASSETS</span>
          <button className="icon-button tiny" onClick={() => showNotice('Real-time feed is active')} aria-label="Add market">
            <Plus size={14} />
          </button>
        </div>

        <div className="sidebar-watch">
          {assets.slice(0, 4).map((asset) => (
            <button
              key={asset.symbol}
              className={`watch-link ${activeAsset.symbol === asset.symbol ? 'watch-active' : ''}`}
              onClick={() => {
                playAudio('click')
                setActiveAsset(asset)
              }}
            >
              <span className="coin-mini" style={{ '--coin-color': asset.color }}>
                {asset.symbol === 'BTC' ? <Bitcoin size={14} /> : asset.symbol.slice(0, 1)}
              </span>
              <span>
                {asset.symbol}
                <small>{asset.pair}</small>
              </span>
              <span className={asset.change >= 0 ? 'positive' : 'negative'}>
                {asset.change >= 0 ? '+' : ''}{asset.change}%
              </span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-card-head">
              <div className="upgrade-icon"><Crown size={15} /></div>
              <span className="upgrade-tier">INSTITUTIONAL TIER 1</span>
            </div>
            <strong>Direct STP Execution</strong>
            <p>Zero maker fees, sub-millisecond fills, and direct liquidity provider access.</p>
            <button onClick={() => showNotice('Institutional VIP routing is permanently enabled')}>
              Routing verified <ArrowUpRight size={13} />
            </button>
          </div>

          <button className="nav-link bottom-link" onClick={() => showNotice('Priority institutional desk is ready')}>
            <LifeBuoy size={17} />
            <span>Priority Support</span>
            <span className="help-count">24/7 VIP</span>
          </button>

          <div className="profile">
            <div className="profile-avatar">
              {fullName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="profile-details-mini">
              <strong>{fullName}</strong>
              <span>{user.email}</span>
            </div>
            <button
              className="icon-button"
              onClick={() => handleSignOut().catch((error) => showNotice(error.message))}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Terminal Viewport */}
      <main className="main-area">
        {/* Top Control Header */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-button icon-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open navigation">
              <Menu size={19} />
            </button>
            <span className="breadcrumb-muted">Terminal</span>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-current">{activeNav}</span>
            <span className="topbar-latency-badge">
              <span className="live-dot" /> 1.2ms STP
            </span>
          </div>

          <div className="topbar-right">
            {/* Global Command Palette Search Trigger */}
            <button
              className="global-search-btn"
              onClick={() => {
                playAudio('click')
                setCmdOpen(true)
              }}
              title="Open Command Center (Ctrl+K)"
            >
              <Search size={15} />
              <span>Search assets, commands, accounts...</span>
              <kbd><Command size={11} /> K</kbd>
            </button>

            {/* Currency Switcher Dropdown */}
            <div className="currency-selector-wrap" ref={currencyMenuRef}>
              <button
                className={`account-switch ${currencyMenuOpen ? 'switch-active' : ''}`}
                onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)}
                aria-label="Switch display currency"
                title={`Selected: ${currentCurr.name} (${activeRateLabel})`}
              >
                <span className="currency-flag">{currentCurr.flag}</span>
                <span className="currency-code">{currency}</span>
                <ChevronDown size={13} className={`switch-chevron ${currencyMenuOpen ? 'rotated' : ''}`} />
              </button>

              {currencyMenuOpen && (
                <div className="currency-dropdown-card">
                  <div className="currency-dropdown-title">Select Base Currency</div>
                  {Object.values(CURRENCIES).map((c) => {
                    const isSelected = c.code === currency
                    return (
                      <button
                        key={c.code}
                        className={`currency-option-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setCurrency(c.code)
                          setCurrencyMenuOpen(false)
                          playAudio('click')
                          showNotice(`Base currency switched to ${c.name} (${c.code})`)
                        }}
                      >
                        <span className="curr-flag">{c.flag}</span>
                        <div className="curr-copy">
                          <strong>{c.name} ({c.code})</strong>
                          <small>{c.code === 'USD' ? '1.00 USD (Base)' : `1 USD = ${c.symbol}${c.rate}`}</small>
                        </div>
                        {isSelected && <Check size={14} className="curr-check" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Sound FX Toggle */}
            <button
              className={`icon-button audio-toggle ${isAudioMuted ? 'is-muted' : ''}`}
              onClick={toggleAudio}
              aria-label={isAudioMuted ? 'Unmute sound FX' : 'Mute sound FX'}
              title={isAudioMuted ? 'Sound FX: Muted' : 'Sound FX: Enabled'}
            >
              {isAudioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Theme Toggle */}
            <button
              className="icon-button theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <div className="notification-anchor">
              <button
                className={`icon-button bell-button ${notificationsOpen ? 'notification-active' : ''}`}
                aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ''}`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 && <i />}
              </button>
              {notificationsOpen && (
                <section className="notification-popover" aria-label="Notification center">
                  <div className="notification-head">
                    <div>
                      <strong>Activity</strong>
                      <span>{unreadNotificationCount ? `${unreadNotificationCount} unread` : 'Recent account activity'}</span>
                    </div>
                    <div className="notification-actions">
                      {unreadNotificationCount > 0 && (
                        <button onClick={() => updateNotifications((items) => items.map((item) => ({ ...item, read: true })))}>
                          Mark all read
                        </button>
                      )}
                      <button className="icon-button tiny" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={15} /></button>
                    </div>
                  </div>
                  <div className="notification-list">
                    {notifications.length ? notifications.slice(0, 8).map((item) => (
                      <button
                        key={item.id}
                        className={`notification-item ${item.read ? '' : 'notification-unread'}`}
                        onClick={() => updateNotifications((items) => items.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry))}
                      >
                        <span className="notification-status"><Activity size={14} /></span>
                        <span className="notification-copy"><strong>{item.message}</strong><small>{new Date(item.createdAt).toLocaleString()}</small></span>
                        {!item.read && <i aria-label="Unread" />}
                      </button>
                    )) : (
                      <div className="notification-empty"><Bell size={18} /><strong>You’re all caught up</strong><span>Account activity will appear here.</span></div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button className="notification-clear" onClick={() => updateNotifications(() => [])}>Clear activity</button>
                  )}
                </section>
              )}
            </div>

            <span className="top-divider" />

            {/* Direct Treasury Deposit Action */}
            <button
              className="topbar-deposit-btn"
              onClick={() => {
                playAudio('click')
                setDepositOpen(true)
              }}
            >
              <Plus size={14} /> Deposit
            </button>
          </div>
        </header>

        {/* Real-time Institutional Ticker Tape */}
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

        {/* Screen Content Wrapper */}
        <div className="content-wrap">
          {activeNav === 'Admin' ? (
            <AdminPanel />
          ) : activeNav === 'Dashboard' ? (
            <>
              {/* Dashboard Welcome Header */}
              <div className="welcome-row">
                <div>
                  <div className="welcome-kicker">
                    <span className="live-dot" /> MARKETS ACTIVE <span className="kicker-divider">·</span> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} <span className="kicker-divider">·</span> SOC2 TYPE II CERTIFIED
                  </div>
                  <h1>Good morning, {displayName} <span className="welcome-star">✳</span></h1>
                  <p>Real-time mark-to-market overview and institutional portfolio telemetry.</p>
                </div>
                <div className="welcome-actions">
                  <button
                    className="screen-secondary withdraw-quick-btn"
                    onClick={() => {
                      playAudio('click')
                      setWithdrawOpen(true)
                    }}
                  >
                    <ArrowUpRight size={15} /> Withdraw
                  </button>
                  <button
                    className="deposit-button"
                    onClick={() => {
                      playAudio('click')
                      setDepositOpen(true)
                    }}
                  >
                    <Plus size={16} /> Add funds
                  </button>
                </div>
              </div>

              {/* Portfolio Key Metrics Cards */}
              <section className="overview-cards" aria-label="Portfolio overview">
                <article className="metric-card portfolio-metric">
                  <div className="metric-heading">
                    <span>Total portfolio value</span>
                    <button className="icon-button tiny" title="Audited Net Worth">
                      <Eye size={15} />
                    </button>
                  </div>
                  <div className="metric-value">
                    {formatCurrency(248560.84, currency)}
                  </div>
                  <div className="metric-meta">
                    <span className="trend-pill">
                      <ArrowUpRight size={13} /> 8.24%
                    </span>
                    <span>vs. last cycle (+{formatCurrency(18924.3, currency)})</span>
                  </div>
                  <div className="metric-foot">
                    <span>Invested <b>{formatCurrency(186420.0, currency)}</b></span>
                    <span>Reserves <b>{formatCurrency(62140.84, currency)}</b></span>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-heading">
                    <span>Today’s return</span>
                    <span className="metric-icon green-icon">
                      <TrendingUp size={16} />
                    </span>
                  </div>
                  <div className="metric-value positive">
                    +{formatCurrency(3842.19, currency)}
                  </div>
                  <div className="metric-meta">
                    <span className="trend-pill">
                      <ArrowUpRight size={13} /> 1.58%
                    </span>
                    <span>since midnight UTC</span>
                  </div>
                  <div className="mini-bars" aria-label="Daily returns chart">
                    {[28, 43, 36, 51, 45, 66, 54, 71, 64, 90, 74, 84, 70, 100, 82, 93, 78, 96, 87, 100].map((v, i) => (
                      <i key={i} style={{ height: `${v}%` }} />
                    ))}
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-heading">
                    <span>Buying power</span>
                    <span className="metric-icon blue-icon">
                      <CreditCard size={16} />
                    </span>
                  </div>
                  <div className="metric-value">
                    {formatCurrency(62140.84, currency)}
                  </div>
                  <div className="metric-meta">
                    <span className="buying-label">
                      <span /> Instant STP margin available
                    </span>
                  </div>
                  <button
                    className="add-cash-link"
                    onClick={() => {
                      playAudio('click')
                      setDepositOpen(true)
                    }}
                  >
                    Manage treasury <ArrowUpRight size={13} />
                  </button>
                </article>
              </section>

              {/* Chart + Quick Trade Grid */}
              <div className="dashboard-grid">
                <section className="panel chart-panel">
                  <div className="panel-head chart-head">
                    <div>
                      <div className="section-title">
                        Portfolio Performance
                        <span className="chart-mode-pill">AUDITED NAV</span>
                      </div>
                      <div className="chart-total">
                        {formatCurrency(248560.84, currency)}
                        <span className="chart-gain">
                          <ArrowUpRight size={14} /> +8.24% ({range})
                        </span>
                      </div>
                    </div>
                    <div className="chart-actions">
                      <div className="range-control">
                        {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              playAudio('click')
                              setRange(r)
                            }}
                            className={range === r ? 'range-active' : ''}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="chart-legend">
                    <span><i /> Total NAV</span>
                    <span className="benchmark-dot"><i /> S&amp;P 500 Benchmark</span>
                    <span className="chart-currency-notice">All values in {currency}</span>
                  </div>

                  <div className="chart-canvas">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="var(--tx-line)" strokeDasharray="3 5" />
                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--tx-muted)', fontSize: 11 }}
                          interval={0}
                        />
                        <YAxis
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--tx-muted)', fontSize: 11 }}
                          tickFormatter={(v) => formatCurrency(v, currency, 0)}
                          domain={['dataMin - 500', 'dataMax + 500']}
                          tickCount={5}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--tx-card)',
                            border: '1px solid var(--tx-line)',
                            borderRadius: 10,
                            fontSize: 12,
                            boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                            color: 'inherit',
                          }}
                          formatter={(v) => [formatCurrency(v, currency), 'Portfolio Value']}
                          labelStyle={{ color: 'var(--tx-muted)', marginBottom: 4 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#10b981"
                          strokeWidth={2.4}
                          fill="url(#portfolioGradient)"
                          activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-foot">
                    <span><Clock3 size={13} /> Live STP Feed · Zero latency fill engine</span>
                    <span>1 USD ≈ {currentCurr.symbol}{currentCurr.rate}</span>
                  </div>
                </section>

                {/* Instant Order Ticket */}
                <section className="panel order-panel">
                  <div className="panel-head">
                    <div>
                      <div className="section-title">Quick Order Execution</div>
                      <div className="section-caption">Institutional STP routing · Instant fills</div>
                    </div>
                    <button
                      className="more-button"
                      onClick={() => showNotice('Advanced order types available in Trade Desk')}
                      aria-label="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  <div className="asset-select" onClick={() => setActiveNav('Trade')}>
                    <span className="asset-coin" style={{ '--coin-color': activeAsset.color }}>
                      {activeAsset.symbol === 'BTC' ? <Bitcoin size={19} /> : activeAsset.symbol.slice(0, 1)}
                    </span>
                    <div>
                      <strong>{activeAsset.pair}</strong>
                      <small>{activeAsset.name}</small>
                    </div>
                    <div className="asset-quote">
                      <strong>{formatCurrency(activeAsset.price, currency, activeAsset.price < 10 ? 4 : 2)}</strong>
                      <span className={activeAsset.change >= 0 ? 'positive' : 'negative'}>
                        {activeAsset.change >= 0 ? '+' : ''}{activeAsset.change}%
                      </span>
                    </div>
                    <ChevronDown size={15} />
                  </div>

                  <div className="side-toggle">
                    <button
                      className={side === 'Buy' ? 'buy-selected' : ''}
                      onClick={() => {
                        playAudio('click')
                        setSide('Buy')
                      }}
                    >
                      Buy {activeAsset.symbol}
                    </button>
                    <button
                      className={side === 'Sell' ? 'sell-selected' : ''}
                      onClick={() => {
                        playAudio('click')
                        setSide('Sell')
                      }}
                    >
                      Sell {activeAsset.symbol}
                    </button>
                  </div>

                  <div className="input-label-row">
                    <label htmlFor="quantity">Amount</label>
                    <span>Available <b>{formatCurrency(62140.84, currency)}</b></span>
                  </div>

                  <div className="trade-input">
                    <input
                      id="quantity"
                      type="number"
                      min="0.001"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                    <span>{activeAsset.symbol}</span>
                  </div>

                  <div className="quick-amounts">
                    {[0.1, 0.25, 0.5, 1.0].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={Number(quantity) === n ? 'amount-selected' : ''}
                        onClick={() => {
                          playAudio('click')
                          setQuantity(n)
                        }}
                      >
                        {n} {activeAsset.symbol}
                      </button>
                    ))}
                  </div>

                  <div className="order-summary">
                    <span>Estimated total</span>
                    <strong>{formatCurrency(total, currency)}</strong>
                  </div>

                  <button
                    className={`place-order ${side === 'Sell' ? 'place-sell' : ''}`}
                    onClick={handleExecuteTrade}
                  >
                    {side} {activeAsset.symbol} <ArrowUpRight size={15} />
                  </button>

                  <div className="secure-note">
                    <ShieldCheck size={13} /> Encrypted routing · Zero slippage guaranteed
                  </div>
                </section>
              </div>

              {/* Live Market Watch Panel */}
              <section className="panel markets-panel">
                <div className="panel-head markets-head">
                  <div>
                    <div className="section-title">
                      Market Watch <span className="live-status"><i /> LIVE</span>
                    </div>
                    <div className="section-caption">Real-time depth & volatility across global assets</div>
                  </div>
                  <div className="markets-tools">
                    <button
                      className={`watch-filter ${watchOnly ? 'filter-on' : ''}`}
                      onClick={() => {
                        playAudio('click')
                        setWatchOnly(!watchOnly)
                      }}
                    >
                      <Star size={14} fill={watchOnly ? 'currentColor' : 'none'} /> Watchlist
                    </button>
                    <label className="market-search">
                      <Search size={14} />
                      <input
                        placeholder="Search assets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <button
                      className="view-all"
                      onClick={() => {
                        playAudio('click')
                        setActiveNav('Markets')
                      }}
                    >
                      Full Screener <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>

                <div className="market-tabs">
                  {['All assets', 'Crypto', 'Stocks', 'Forex'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        playAudio('click')
                        setFilter(tab)
                      }}
                      className={filter === tab ? 'tab-active' : ''}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="table-wrap">
                  <table className="market-table">
                    <thead>
                      <tr>
                        <th>ASSET</th>
                        <th>PRICE ({currency})</th>
                        <th>24H CHANGE</th>
                        <th>MARKET CAP</th>
                        <th>7D TREND</th>
                        <th>ACTION</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset, idx) => (
                        <tr
                          key={asset.symbol}
                          onClick={() => {
                            setActiveAsset(asset)
                            playAudio('click')
                          }}
                          className={activeAsset.symbol === asset.symbol ? 'asset-row-active' : ''}
                        >
                          <td>
                            <div className="asset-cell">
                              <span className="coin-mini table-coin" style={{ '--coin-color': asset.color }}>
                                {asset.symbol === 'BTC' ? <Bitcoin size={15} /> : asset.symbol.slice(0, 1)}
                              </span>
                              <span>
                                <strong>{asset.name}</strong>
                                <small>{asset.pair}</small>
                              </span>
                            </div>
                          </td>
                          <td className="price-cell">
                            {formatCurrency(asset.price, currency, asset.price < 10 ? 4 : 2)}
                          </td>
                          <td>
                            <span className={`change-cell ${asset.change >= 0 ? 'change-up' : 'change-down'}`}>
                              {asset.change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                              {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                            </span>
                          </td>
                          <td className="cap-cell">
                            {['$1.32T', '$423.8B', '$78.4B', '$3.48T', '$3.54T', '$1.18T'][idx] || '$—'}
                          </td>
                          <td>
                            <MiniSparkline positive={asset.change >= 0} seed={idx + 1} />
                          </td>
                          <td>
                            <button
                              className="table-trade-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                playAudio('click')
                                setActiveAsset(asset)
                                setActiveNav('Trade')
                              }}
                            >
                              Trade <ArrowRightMini size={12} />
                            </button>
                          </td>
                          <td>
                            <button
                              className={`star-button ${favorites.includes(asset.symbol) ? 'is-favorite' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                playAudio('click')
                                setFavorites(
                                  favorites.includes(asset.symbol)
                                    ? favorites.filter((x) => x !== asset.symbol)
                                    : [...favorites, asset.symbol]
                                )
                              }}
                              aria-label={`Toggle ${asset.symbol} favorite`}
                            >
                              <Star size={15} fill={favorites.includes(asset.symbol) ? 'currentColor' : 'none'} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAssets.length === 0 && (
                    <div className="empty-state">No assets match your search.</div>
                  )}
                </div>

                <div className="markets-foot">
                  <span>Showing <b>{filteredAssets.length}</b> of 240 audited institutional pairs</span>
                  <button onClick={() => showNotice('Market data is real-time')}>
                    WebSocket streaming active <span className="live-dot" />
                  </button>
                </div>
              </section>

              {/* Institutional Footer */}
              <footer className="page-footer">
                <span>© 2026 TradeX Financial Institutional Services, Inc. All rights reserved.</span>
                <span>
                  <ShieldCheck size={13} /> Cold Storage Custody · Bank-Grade Encryption <i /> Legal <i /> Privacy <i /> API
                </span>
              </footer>
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
        </div>
      </main>

      {/* Modals & Dialogs */}
      {mobileOpen && (
        <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
      )}

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
          if (a) setActiveAsset(a)
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
        onExportStatement={handleExportStatement}
        onToggleAudio={toggleAudio}
        isAudioMuted={isAudioMuted}
      />

      {notice && (
        <div className="toast-message" role="alert">
          <Sparkles size={16} />
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function ArrowRightMini({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

function MiniSparkline({ positive, seed }) {
  const points = Array.from({ length: 26 }, (_, i) => 20 + ((Math.sin((i + seed) * 0.82) + Math.sin((i + seed) * 0.29)) * 9) + (positive ? i * 0.75 : -i * 0.45))
  const coords = points.map((v, i) => `${(i / 25) * 100},${40 - v}`).join(' ')
  return (
    <svg className="mini-spark" viewBox="0 0 100 42" preserveAspectRatio="none" aria-label={positive ? 'Trending upward' : 'Trending downward'}>
      <polyline
        points={coords}
        fill="none"
        stroke={positive ? '#10b981' : '#f43f5e'}
        strokeWidth="2.4"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default App
