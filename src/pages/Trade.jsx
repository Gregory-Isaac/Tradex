import { ArrowDownRight, ArrowUpRight, BarChart3, BellRing, BriefcaseBusiness, CandlestickChart, CircleDollarSign, ShieldCheck } from 'lucide-react'

const watchlist = [
  { pair: 'BTC/USD', value: '$67,234.50', change: '+2.34%' },
  { pair: 'ETH/USD', value: '$3,456.78', change: '+1.56%' },
  { pair: 'SOL/USD', value: '$178.90', change: '-0.89%' },
  { pair: 'XAU/USD', value: '$2,348.10', change: '+0.72%' },
]

export default function Trade() {
  return (
    <div className="page-shell trade-page">
      <section className="top-summary-row">
        <div className="panel summary-strip">
          <div>
            <span className="muted">Active pair</span>
            <h3>BTC/USD</h3>
          </div>
          <div>
            <span className="muted">Last</span>
            <strong className="positive">$67,234.50</strong>
          </div>
          <div>
            <span className="muted">24h range</span>
            <strong>$64,420 — $68,780</strong>
          </div>
          <div>
            <span className="muted">Trend</span>
            <span className="chip positive">Bullish</span>
          </div>
        </div>
      </section>

      <section className="trading-grid">
        <div className="panel chart-panel">
          <div className="section-heading">
            <h3>Execution canvas</h3>
            <div className="segmented-control">
              <button className="active">1D</button>
              <button>1W</button>
              <button>1M</button>
            </div>
          </div>

          <div className="price-hero">
            <div>
              <span className="muted">Current price</span>
              <h2>$67,234.50</h2>
            </div>
            <span className="chip positive">+2.34%</span>
          </div>

          <div className="chart-surface" aria-label="Price chart area">
            <span className="chart-line" />
            <div className="chart-bars">
              <span style={{ height: '38%' }} />
              <span style={{ height: '30%' }} />
              <span style={{ height: '65%' }} />
              <span style={{ height: '44%' }} />
              <span style={{ height: '72%' }} />
              <span style={{ height: '60%' }} />
              <span style={{ height: '90%' }} />
              <span style={{ height: '78%' }} />
              <span style={{ height: '92%' }} />
              <span style={{ height: '75%' }} />
              <span style={{ height: '100%' }} />
              <span style={{ height: '97%' }} />
              <span style={{ height: '80%' }} />
              <span style={{ height: '84%' }} />
            </div>
          </div>
        </div>

        <aside className="panel order-panel">
          <div className="section-heading compact">
            <h3>Order ticket</h3>
            <span className="status-pill success">Live</span>
          </div>

          <div className="trade-toggle">
            <button className="active">Buy</button>
            <button>Sell</button>
          </div>

          <div className="field-group">
            <label>Amount</label>
            <div className="quantity-field">
              <button type="button">−</button>
              <input type="text" value="0.75 BTC" readOnly />
              <button type="button">+</button>
            </div>
          </div>

          <div className="field-group">
            <label>Order type</label>
            <select defaultValue="market">
              <option value="market">Market order</option>
              <option value="limit">Limit order</option>
              <option value="stop">Stop loss</option>
            </select>
          </div>

          <div className="order-summary">
            <div className="order-summary-item"><span>Notional</span><strong>$50,425.00</strong></div>
            <div className="order-summary-item"><span>Fee</span><strong>$252.13</strong></div>
            <div className="order-summary-item"><span>Slippage</span><strong>0.12%</strong></div>
          </div>

          <button className="primary-btn wide-btn">Confirm buy</button>
        </aside>
      </section>

      <section className="panel mini-market-panel">
        <div className="section-heading">
          <h3>Watchlist</h3>
          <button className="text-btn">Open scanner</button>
        </div>
        <div className="watchlist-grid">
          {watchlist.map((item) => (
            <div key={item.pair} className="watch-card">
              <div className="watch-header">
                <strong>{item.pair}</strong>
                <span className={item.change.startsWith('+') ? 'positive' : 'negative'}>{item.change}</span>
              </div>
              <div className="watch-value">{item.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
