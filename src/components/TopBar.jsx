import { useState } from 'react'
import { 
  Search, Bell, ChevronDown, TrendingUp, TrendingDown,
  Moon, Globe, Maximize
} from 'lucide-react'
import './TopBar.css'

const tickerData = [
  { symbol: 'BTC', price: '67,234.50', change: '+2.34%', up: true },
  { symbol: 'ETH', price: '3,456.78', change: '+1.56%', up: true },
  { symbol: 'SOL', price: '178.90', change: '-0.89%', up: false },
  { symbol: 'BNB', price: '567.23', change: '+3.21%', up: true },
  { symbol: 'XRP', price: '0.6234', change: '-1.23%', up: false },
  { symbol: 'ADA', price: '0.4567', change: '+0.78%', up: true },
]

export default function TopBar() {
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifications] = useState(3)

  return (
    <header className="topbar">
      <div className="ticker-strip">
        <div className="ticker-scroll">
          {[...tickerData, ...tickerData].map((item, i) => (
            <div key={i} className="ticker-item">
              <span className="ticker-symbol">{item.symbol}</span>
              <span className="ticker-price">${item.price}</span>
              <span className={`ticker-change ${item.up ? 'up' : 'down'}`}>
                {item.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="topbar-main">
        <div className={`search-box ${searchFocused ? 'focused' : ''}`}>
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search markets, pairs, assets..." 
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd>⌘K</kbd>
        </div>

        <div className="topbar-actions">
          <button className="action-btn" title="Theme">
            <Moon size={18} />
          </button>
          <button className="action-btn" title="Language">
            <Globe size={18} />
          </button>
          <button className="action-btn" title="Fullscreen">
            <Maximize size={18} />
          </button>
          
          <button className="action-btn notification-btn" title="Notifications">
            <Bell size={18} />
            {notifications > 0 && (
              <span className="notification-badge">{notifications}</span>
            )}
          </button>

          <div className="user-menu">
            <div className="user-avatar">
              <span>JD</span>
            </div>
            <div className="user-info">
              <span className="user-name">John Doe</span>
              <span className="user-level">Pro Trader</span>
            </div>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>
    </header>
  )
}
