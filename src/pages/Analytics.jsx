import { BarChart3, TrendingUp } from 'lucide-react'

const metrics = [
  { label: 'Net return', value: '+26.8%', tone: 'positive' },
  { label: 'Sharpe ratio', value: '1.82', tone: 'positive' },
  { label: 'Max drawdown', value: '-7.4%', tone: 'negative' },
  { label: 'Win streak', value: '12 trades', tone: 'neutral' },
]

const bars = [72, 62, 88, 58, 95, 81, 67]

export default function Analytics() {
  return (
    <div className="page-shell analytics-page">
      <section className="stats-row">
        {metrics.map((item) => (
          <div key={item.label} className="panel metric-box">
            <span className="muted">{item.label}</span>
            <h3 className={item.tone === 'negative' ? 'negative' : item.tone === 'positive' ? 'positive' : ''}>{item.value}</h3>
          </div>
        ))}
      </section>

      <section className="panel performance-panel">
        <div className="section-heading">
          <h3>Performance</h3>
          <button className="text-btn">Forecast</button>
        </div>

        <div className="chart-bars large-bars" aria-label="Performance bars">
          {bars.map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
      </section>
    </div>
  )
}
