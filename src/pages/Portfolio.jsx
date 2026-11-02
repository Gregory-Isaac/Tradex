import { ArrowUpRight, BriefcaseBusiness, Coins, PieChart, ShieldCheck } from 'lucide-react'

const holdings = [
  { asset: 'Bitcoin', symbol: 'BTC', allocation: '42%', value: '$540,000', pnl: '+9.8%' },
  { asset: 'Ethereum', symbol: 'ETH', allocation: '27%', value: '$348,000', pnl: '+6.2%' },
  { asset: 'Solana', symbol: 'SOL', allocation: '18%', value: '$232,000', pnl: '+3.6%' },
  { asset: 'Gold', symbol: 'XAU', allocation: '13%', value: '$164,000', pnl: '+1.2%' },
]

export default function Portfolio() {
  return (
    <div className="page-shell portfolio-page">
      <section className="stats-row compact-row">
        <div className="panel stat-tile">
          <span className="muted">Portfolio value</span>
          <h3>$1,284,960</h3>
          <strong className="positive">+$81,240</strong>
        </div>
        <div className="panel stat-tile">
          <span className="muted">Realized P/L</span>
          <h3>$214,800</h3>
          <strong className="positive">+18.4%</strong>
        </div>
        <div className="panel stat-tile">
          <span className="muted">Daily cashflow</span>
          <h3>$12,400</h3>
          <strong className="negative">-0.8%</strong>
        </div>
      </section>

      <section className="portfolio-grid">
        <div className="panel holdings-panel">
          <div className="section-heading">
            <h3>Holdings</h3>
            <button className="text-btn">Rebalance</button>
          </div>
          <div className="holdings-list">
            {holdings.map((asset) => (
              <div key={asset.symbol} className="holding-row">
                <div className="holding-meta">
                  <div className="coin-badge">{asset.symbol.slice(0, 2)}</div>
                  <div>
                    <strong>{asset.asset}</strong>
                    <span>{asset.symbol}</span>
                  </div>
                </div>
                <div className="holding-metrics">
                  <span>{asset.allocation}</span>
                  <strong>{asset.value}</strong>
                  <em className="positive">{asset.pnl}</em>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="panel allocation-panel">
          <div className="section-heading">
            <h3>Allocation</h3>
            <ShieldCheck size={18} className="muted-icon" />
          </div>
          <div className="allocation-visual">
            <div className="donut-chart">
              <div className="donut-center">
                <span>72%</span>
                <small>Growth</small>
              </div>
            </div>
          </div>
          <div className="allocation-legend">
            <div><span className="legend-dot blue" /> Digital assets</div>
            <div><span className="legend-dot teal" /> Commodities</div>
            <div><span className="legend-dot violet" /> Stable cash</div>
          </div>
        </aside>
      </section>
    </div>
  )
}
