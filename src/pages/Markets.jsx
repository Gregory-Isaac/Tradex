import { ArrowUpRight, BarChart3, Globe2, TrendingUp } from 'lucide-react'

const marketCards = [
  { name: 'Global Crypto', value: '$2.81T', change: '+4.12%', trend: 'up' },
  { name: 'Macro Index', value: '102.42', change: '+1.04%', trend: 'up' },
  { name: 'Volatility', value: '28.4%', change: '-1.28%', trend: 'down' },
  { name: 'Sentiment', value: 'Bullish', change: '+7.26%', trend: 'up' },
]

const watchlist = [
  { pair: 'BTC/USD', price: '$67,234.50', volume: '$42.8B', change: '+2.34%' },
  { pair: 'ETH/USD', price: '$3,456.78', volume: '$18.6B', change: '+1.56%' },
  { pair: 'XAU/USD', price: '$2,348.10', volume: '$5.4B', change: '+0.72%' },
  { pair: 'EUR/USD', price: '1.0857', volume: '$2.7B', change: '+0.18%' },
]

export default function Markets() {
  return (
    <div className="page-shell markets-page">
      <section className="market-cards-grid">
        {marketCards.map((card) => (
          <div key={card.name} className="panel market-card">
            <div className="market-card-head">
              <span>{card.name}</span>
              {card.trend === 'up' ? <ArrowUpRight className="positive" size={18} /> : <ArrowUpRight className="negative" size={18} style={{ transform: 'rotate(180deg)' }} />}
            </div>
            <h3>{card.value}</h3>
            <strong className={card.trend === 'up' ? 'positive' : 'negative'}>{card.change}</strong>
          </div>
        ))}
      </section>

      <section className="panel market-table-panel">
        <div className="section-heading">
          <h3>Market overview</h3>
          <button className="text-btn">Export</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Price</th>
              <th>Volume</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((row) => (
              <tr key={row.pair}>
                <td><strong>{row.pair}</strong></td>
                <td>{row.price}</td>
                <td>{row.volume}</td>
                <td className={row.change.startsWith('+') ? 'positive' : 'negative'}>{row.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
