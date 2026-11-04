import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, ArrowLeftRight, PieChart, TrendingUp, 
  Wallet, BarChart3, Settings, ChevronLeft, ChevronRight,
  Zap, Shield, LogOut
} from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/trade', icon: ArrowLeftRight, label: 'Trade' },
  { path: '/portfolio', icon: PieChart, label: 'Portfolio' },
  { path: '/markets', icon: TrendingUp, label: 'Markets' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
]

const bottomItems = [
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <Zap size={20} />
          </div>
          {!collapsed && <span className="logo-text">TradeX</span>}
        </div>
        <button className="collapse-btn" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="pro-badge">
          <Shield size={14} />
          <span>Ultra Premium</span>
        </div>
      )}

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <span className="nav-label">Main</span>}
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && location.pathname === item.path && (
                <div className="active-indicator" />
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        {bottomItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
        {!collapsed && (
          <button className="nav-item logout-btn">
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        )}
      </div>
    </aside>
  )
}
