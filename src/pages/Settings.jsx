import { Bell, Globe, ShieldCheck, SlidersHorizontal } from 'lucide-react'

const toggles = [
  { label: '2FA security', enabled: true },
  { label: 'Trade confirmations', enabled: true },
  { label: 'Market alerts', enabled: false },
  { label: 'Auto rebalancing', enabled: true },
]

export default function Settings() {
  return (
    <div className="page-shell settings-page">
      <section className="panel settings-panel">
        <div className="section-heading">
          <h3>Trading preferences</h3>
          <button className="text-btn">Save changes</button>
        </div>

        <div className="settings-grid">
          <div className="setting-card">
            <div className="setting-icon"><SlidersHorizontal size={18} /></div>
            <div>
              <strong>Execution profile</strong>
              <small>Adaptive limit / market blending</small>
            </div>
          </div>
          <div className="setting-card">
            <div className="setting-icon"><Bell size={18} /></div>
            <div>
              <strong>Notifications</strong>
              <small>Price alerts and execution notices</small>
            </div>
          </div>
          <div className="setting-card">
            <div className="setting-icon"><Globe size={18} /></div>
            <div>
              <strong>Regions</strong>
              <small>EU, UK, US multi-market access</small>
            </div>
          </div>
          <div className="setting-card">
            <div className="setting-icon"><ShieldCheck size={18} /></div>
            <div>
              <strong>Security center</strong>
              <small>Biometric and device verification</small>
            </div>
          </div>
        </div>

        <div className="toggle-list">
          {toggles.map((item) => (
            <div key={item.label} className="toggle-row">
              <span>{item.label}</span>
              <button className={`toggle-switch ${item.enabled ? 'on' : ''}`} type="button" aria-label={item.label}>
                <span />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
