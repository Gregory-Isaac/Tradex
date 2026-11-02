import { ArrowDownLeft, ArrowUpRight, CreditCard, Wallet2 } from 'lucide-react'

const balances = [
  { currency: 'USD', amount: '$245,680', available: 'Available: $234,890' },
  { currency: 'BTC', amount: '3.42 BTC', available: 'Available: 3.42 BTC' },
  { currency: 'ETH', amount: '18.90 ETH', available: 'Available: 18.90 ETH' },
]

const moves = [
  { title: 'BTC transfer received', detail: 'From cold wallet • 2h ago', amount: '+0.25 BTC', positive: true },
  { title: 'ETH strategy payout', detail: 'From Alpha execution • 7h ago', amount: '+2.10 ETH', positive: true },
  { title: 'USD withdrawal', detail: 'To Bank transfer • Yesterday', amount: '-$12,500', positive: false },
]

export default function Wallet() {
  return (
    <div className="page-shell wallet-page">
      <section className="wallet-overview panel">
        <div className="section-heading">
          <h3>Wallet overview</h3>
          <button className="text-btn">Add funds</button>
        </div>

        <div className="balance-grid">
          {balances.map((balance) => (
            <div key={balance.currency} className="balance-card">
              <span className="muted">{balance.currency}</span>
              <h3>{balance.amount}</h3>
              <small>{balance.available}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="wallet-transactions panel">
        <div className="section-heading">
          <h3>Recent activity</h3>
          <button className="text-btn">Statement</button>
        </div>

        <div className="transaction-list">
          {moves.map((item) => (
            <div key={item.title} className="transaction-row">
              <div className="transaction-icon">
                {item.positive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
              </div>
              <div>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </div>
              <span className={item.positive ? 'positive' : 'negative'}>{item.amount}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
