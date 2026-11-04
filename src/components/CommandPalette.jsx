import { useEffect, useState, useRef } from 'react'
import {
  Search, LayoutDashboard, ArrowLeftRight, BriefcaseBusiness, TrendingUp,
  Wallet, BarChart3, Settings2, ShieldCheck, Sun, Moon, Plus, ArrowUpRight,
  Download, Volume2, VolumeX, Sparkles, X, ChevronRight, Bitcoin
} from 'lucide-react'
import './CommandPalette.css'

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onSelectAsset,
  onOpenDeposit,
  onOpenWithdraw,
  theme,
  onToggleTheme,
  onExportStatement,
  onToggleAudio,
  isAudioMuted,
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setQuery('')
        setSelectedIndex(0)
        inputRef.current?.focus()
      }, 30)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const actions = [
    // Navigation
    { id: 'nav-dashboard', category: 'Navigation', label: 'Go to Dashboard', icon: LayoutDashboard, action: () => onNavigate('Dashboard') },
    { id: 'nav-trade', category: 'Navigation', label: 'Go to Trade Desk (Pro Execution)', icon: ArrowLeftRight, action: () => onNavigate('Trade') },
    { id: 'nav-portfolio', category: 'Navigation', label: 'Go to Portfolio & Allocation', icon: BriefcaseBusiness, action: () => onNavigate('Portfolio') },
    { id: 'nav-markets', category: 'Navigation', label: 'Go to Markets Intelligence', icon: TrendingUp, action: () => onNavigate('Markets') },
    { id: 'nav-wallet', category: 'Navigation', label: 'Go to Multi-Asset Wallet', icon: Wallet, action: () => onNavigate('Wallet') },
    { id: 'nav-analytics', category: 'Navigation', label: 'Go to Quant Analytics & Risk', icon: BarChart3, action: () => onNavigate('Analytics') },
    { id: 'nav-settings', category: 'Navigation', label: 'Go to Account Settings', icon: Settings2, action: () => onNavigate('Settings') },
    { id: 'nav-admin', category: 'Navigation', label: 'Go to Administrator Access', icon: ShieldCheck, action: () => onNavigate('Admin') },

    // Assets
    { id: 'asset-btc', category: 'Markets', label: 'Trade Bitcoin (BTC / USD)', icon: Bitcoin, action: () => { onSelectAsset('BTC'); onNavigate('Trade') } },
    { id: 'asset-eth', category: 'Markets', label: 'Trade Ethereum (ETH / USD)', icon: Sparkles, action: () => { onSelectAsset('ETH'); onNavigate('Trade') } },
    { id: 'asset-sol', category: 'Markets', label: 'Trade Solana (SOL / USD)', icon: Sparkles, action: () => { onSelectAsset('SOL'); onNavigate('Trade') } },
    { id: 'asset-nvda', category: 'Markets', label: 'Trade NVIDIA Corporation (NVDA)', icon: TrendingUp, action: () => { onSelectAsset('NVDA'); onNavigate('Trade') } },
    { id: 'asset-aapl', category: 'Markets', label: 'Trade Apple Inc. (AAPL)', icon: TrendingUp, action: () => { onSelectAsset('AAPL'); onNavigate('Trade') } },

    // Financial Actions
    { id: 'act-deposit', category: 'Actions', label: 'Deposit Funds (M-Pesa, Card, Crypto)', icon: Plus, action: onOpenDeposit },
    { id: 'act-withdraw', category: 'Actions', label: 'Withdraw Funds', icon: ArrowUpRight, action: onOpenWithdraw },
    { id: 'act-export', category: 'Actions', label: 'Download Account Statement (CSV)', icon: Download, action: onExportStatement },
    { id: 'act-theme', category: 'Preferences', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, icon: theme === 'dark' ? Sun : Moon, action: onToggleTheme },
    { id: 'act-audio', category: 'Preferences', label: isAudioMuted ? 'Enable Sound FX' : 'Mute Sound FX', icon: isAudioMuted ? Volume2 : VolumeX, action: onToggleAudio },
  ]

  const filtered = actions.filter((item) =>
    `${item.category} ${item.label}`.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = filtered[selectedIndex]
        if (selected) {
          selected.action()
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div className="cmd-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-header">
          <Search size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            placeholder="Type a command or search assets..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="cmd-input"
          />
          <kbd className="cmd-kbd">ESC</kbd>
          <button className="cmd-close" onClick={onClose} aria-label="Close command palette">
            <X size={16} />
          </button>
        </div>

        <div className="cmd-list">
          {filtered.length === 0 ? (
            <div className="cmd-empty">No results found for "{query}"</div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={item.id}
                  className={`cmd-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    item.action()
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span className="cmd-item-icon">
                    <Icon size={16} />
                  </span>
                  <div className="cmd-item-text">
                    <span className="cmd-item-label">{item.label}</span>
                    <span className="cmd-item-category">{item.category}</span>
                  </div>
                  <ChevronRight size={14} className="cmd-chevron" />
                </button>
              )
            })
          )}
        </div>

        <div className="cmd-footer">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select with <kbd>↵ Enter</kbd></span>
          <span>Exit with <kbd>ESC</kbd></span>
        </div>
      </div>
    </div>
  )
}
