import { ArrowDownRight, ArrowUpRight, BarChart3, Coins, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import StatCard from '../components/StatCard'

const marketRows = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: '$67,234.50', change: '+2.34%', positive: true, volume: '$42.8B' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,456.78', change: '+1.56%', positive: true, volume: '$18.6B' },
  { symbol: 'SOL/USD', name: 'Solana', price: '$178.90', change: '-0.89%', positive: false, volume: '$7.2B' },
  { symbol: 'XAU/USD', name: 'Gold', price: '$2,348.10', change: '+0.72%', positive: true, volume: '$5.4B' },
  { symbol: 'NVDA', name: 'NVIDIA', price: '$1,024.92', change: '+3.18%', positive: true, volume: '$12.8B' },
]

const holdings = [
  { asset: 'BTC', qty: '2.15', value: '$144,200', pnl: '+8.42%', positive: true },
  { asset: 'ETH', qty: '18.40', value: '$63,500', pnl: '+5.76%', positive: true },
  { asset: 'SOL', qty: '640.00', value: '$114,180', pnl: '-2.11%', positive: false },
]

const movers = [
  { name: 'AAVE', price: '$128.44', change: '+6.42%', positive: true },
  { name: 'ARB', price: '$1.23', change: '+4.32%', positive: true },
  { name: 'NEAR', price: '$7.12', change: '-1.84%', positive: false },
  { name: 'LINK', price: '$18.46', change: '+2.17%', positive: true },
]

const activity = [
  { label: 'BTC breakout confirmed', time: '14 min ago', type: 'positive' },
  { label: 'ETH hedge closed', time: '27 min ago', type: 'neutral' },
  { label: 'Risk alert: USD/JPY', time: '42 min ago', type: 'warning' },
]

export default function Dashboard() {
  return (
    <div className="page-shell dashboard-page">
      <section className="hero-panel panel">
        <div className="hero-copy">
          <p className="eyebrow">Professional Market Intelligence</p>
          <h1>Trade smarter with precision-built execution.</h1>
          <p className="subtext">
            Track macro trends, manage risk, and convert volatility into disciplined opportunities across crypto, FX, and equities.
          </p>
          <div className="hero-actions">
            <button className="primary-btn">Launch strategy</button>
            <button className="secondary-btn">View markets</button>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-topline">
            <span>Portfolio value</span>
            <span className="status-pill success">Live</span>
          </div>
          <h2>$1,284,960</h2>
          <div className="mini-grid">
            <div>
              <label>24h P/L</label>
              <strong className="positive">+$18,240</strong>
            </div>
            <div>
              <label>Exposure</label>
              <strong>63.2%</strong>
            </div>
            <div>
              <label>Win rate</label>
              <strong>71%</strong>
            </div>
            <div>
              <label>Drawdown</label>
              <strong className="negative">-4.1%</strong>
            </div>
          </div>
          <div className="sparkline" aria-label="Portfolio performance chart">
            <span style={{ height: '36%' }} />
            <span style={{ height: '52%' }} />
            <span style={{ height: '41%' }} />
            <span style={{ height: '70%' }} />
            <span style={{ height: '58%' }} />
            <span style={{ height: '84%' }} />
            <span style={{ height: '68%' }} />
            <span style={{ height: '92%' }} />
            <span style={{ height: '100%' }} />
            <span style={{ height: '88%' }} />
          </div>
        </div>
      </section>

      <section className="stats-row">
        <StatCard title="Balance" value="$482.9K" change="vs last month" changePercent="+12.4%" icon={Coins} trend="up" accent />
        <StatCard title="Open P/L" value="$56.8K" change="today" changePercent="+3.2%" icon={TrendingUp} trend="up" />
        <StatCard title="Risk Score" value="Low" change="healthy" changePercent="-1.9%" icon={ShieldCheck} trend="down" />
      </section>

      <section className="content-grid">
        <div className="panel table-panel">
          <div className="section-heading">
            <h3>Market watch</h3>
            <button className="text-btn">View all</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Pair</th>
                <th>Last price</th>
                <th>24h</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {marketRows.map((row) => (
                <tr key={row.symbol} className={row.positive ? 'selected-row' : ''}>
                  <td>
                    <div className="symbol-cell">
                      <strong>{row.symbol}</strong>
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td>{row.price}</td>
                  <td className={row.positive ? 'positive' : 'negative'}>{row.change}</td>
                  <td>{row.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="panel trade-panel">
          <div className="section-heading compact">
            <h3>Quick trade</h3>
            <span className="price-tag">BTC/USD</span>
          </div>

          <div className="trade-toggle">
            <button className="active">Buy</button>
            <button>Sell</button>
          </div>

          <div className="field-label">Order size</div>
          <div className="quantity-field">
            <button type="button">−</button>
            <input type="text" value="0.25 BTC" readOnly />
            <button type="button">+</button>
          </div>

          <div className="order-summary">
            <div className="order-summary-item">
              <span>Estimated cost</span>
              <strong>$16,808.63</strong>
            </div>
            <div className="order-summary-item">
              <span>Fees</span>
              <strong>$84.04</strong>
            </div>
          </div>

          <button className="primary-btn wide-btn">Place buy order</button>
        </aside>
      </section>

      <section className="lower-grid">
        <div className="panel positions-panel">
          <div className="section-heading">
            <h3>Active positions</h3>
            <button className="text-btn">Manage</button>
          </div>
          <div className="position-list">
            {holdings.map((holding) => (
              <div key={holding.asset} className="position-row">
                <div>
                  <strong>{holding.asset}</strong>
                  <span>Qty {holding.qty}</span>
                </div>
                <div>
                  <strong>{holding.value}</strong>
                  <span className={holding.positive ? 'positive' : 'negative'}>{holding.pnl}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel movers-panel">
          <div className="section-heading">
            <h3>Top movers</h3>
            <span className="chip neutral">Today</span>
          </div>
          <div className="movers-list">
            {movers.map((mover) => (
              <div key={mover.name} className="mover-item">
                <div>
                  <strong>{mover.name}</strong>
                  <span>{mover.price}</span>
                </div>
                <div className="mover-metrics">
                  <span className={mover.positive ? 'positive' : 'negative'}>{mover.change}</span>
                  {mover.positive ? <ArrowUpRight size={16} className="positive" /> : <ArrowDownRight size={16} className="negative" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="section-heading">
            <h3>Signals</h3>
            <span className="chip positive">AI synced</span>
          </div>
          <ul className="activity-list">
            {activity.map((item) => (
              <li key={item.label}>
                <span className={`dot ${item.type}`} />
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.time}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
