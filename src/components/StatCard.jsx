import { TrendingUp, TrendingDown } from 'lucide-react'
import './StatCard.css'

export default function StatCard({ title, value, change, changePercent, icon: Icon, trend, accent }) {
  const isPositive = trend === 'up'
  
  return (
    <div className={`stat-card ${accent ? 'accent' : ''}`}>
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className="stat-icon">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {change !== undefined && (
        <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{changePercent}</span>
          <span className="stat-change-label">{change}</span>
        </div>
      )}
    </div>
  )
}
