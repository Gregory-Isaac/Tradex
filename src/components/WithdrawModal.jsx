import { useState } from 'react'
import { X, ArrowUpRight, Phone, Building, CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react'
import { playAudio } from '../utils/audio.js'
import { readApiResponse } from '../api.js'
import './DepositModal.css'

export default function WithdrawModal({ isOpen, onClose, user, onWithdrawSuccess }) {
  const [method, setMethod] = useState('mpesa') // 'mpesa' | 'bank'
  const [phone, setPhone] = useState(user?.phone || '+254 712 345 678')
  const [bankAccount, setBankAccount] = useState('')
  const [amountKes, setAmountKes] = useState('2000')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [refCode, setRefCode] = useState('')

  if (!isOpen) return null

  const maxKes = Number(user?.balanceKes) || 0

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setError('')
    const amount = Math.floor(Number(amountKes))
    if (!amount || amount <= 0) {
      setError('Please enter a valid withdrawal amount.')
      return
    }
    if (amount > maxKes) {
      setError(`Withdrawal amount (KES ${amount.toLocaleString()}) exceeds your available balance of KES ${maxKes.toLocaleString()}.`)
      return
    }

    setBusy(true)
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountKes: amount }),
      })

      const data = await readApiResponse(response)
      if (!response.ok) {
        throw new Error(data.error || 'Withdrawal could not be processed.')
      }

      playAudio('success')
      setRefCode(`TX-WDR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)
      setSuccess(true)
      onWithdrawSuccess?.(data.balanceKes)
    } catch (err) {
      setError(err.message || 'Withdrawal could not be processed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setSuccess(false)
    setBusy(false)
    setError('')
    onClose()
  }

  return (
    <div className="deposit-backdrop" onClick={reset} role="dialog" aria-modal="true">
      <div className="deposit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="deposit-modal-header">
          <div className="deposit-header-copy">
            <span className="deposit-kicker"><ShieldCheck size={13} /> SECURE WITHDRAWAL</span>
            <h2>Withdraw Funds</h2>
          </div>
          <button className="deposit-close" onClick={reset} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {!success ? (
          <>
            <div className="deposit-tabs">
              <button
                className={`deposit-tab ${method === 'mpesa' ? 'active' : ''}`}
                onClick={() => { setMethod('mpesa'); setError('') }}
                type="button"
              >
                <Phone size={15} /> M-Pesa Payout
              </button>
              <button
                className={`deposit-tab ${method === 'bank' ? 'active' : ''}`}
                onClick={() => { setMethod('bank'); setError('') }}
                type="button"
              >
                <Building size={15} /> Bank Transfer
              </button>
            </div>

            <div className="deposit-body">
              {error && <p className="deposit-error" role="alert">{error}</p>}
              <form onSubmit={handleWithdraw} className="deposit-form">
                <div className="deposit-field">
                  <div className="deposit-label-row">
                    <label htmlFor="wdr-amount">Withdrawal Amount (KES)</label>
                    <span className="deposit-usd-equiv">Available: KES {maxKes.toLocaleString()}</span>
                  </div>
                  <div className="deposit-input-box">
                    <span className="currency-prefix">KES</span>
                    <input
                      id="wdr-amount"
                      type="number"
                      min="100"
                      max={maxKes}
                      value={amountKes}
                      onChange={(e) => setAmountKes(e.target.value)}
                      required
                    />
                  </div>
                  <div className="deposit-chips">
                    {[1000, 5000, 10000, maxKes].filter((amt, idx, arr) => amt > 0 && arr.indexOf(amt) === idx).map((amt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAmountKes(String(amt))}
                      >
                        {amt === maxKes ? 'All Max' : `KES ${amt.toLocaleString()}`}
                      </button>
                    ))}
                  </div>
                </div>

                {method === 'mpesa' ? (
                  <div className="deposit-field">
                    <label htmlFor="wdr-phone">Recipient M-Pesa Number</label>
                    <div className="deposit-input-box">
                      <Phone size={16} />
                      <input
                        id="wdr-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+254 712 345 678"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="deposit-field">
                    <label htmlFor="wdr-bank">Bank Account & Institution</label>
                    <div className="deposit-input-box">
                      <Building size={16} />
                      <input
                        id="wdr-bank"
                        placeholder="e.g. Equity Bank · 011029384729"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="deposit-note">
                  <ShieldCheck size={14} className="deposit-note-icon" />
                  <span>Instant processing. Sent directly via Safaricom B2C payout rails.</span>
                </div>

                <button type="submit" className="deposit-submit" disabled={busy || maxKes <= 0}>
                  {busy ? <LoaderCircle className="spinner" size={17} /> : <>Confirm Withdrawal <ArrowUpRight size={16} /></>}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="deposit-success-state">
            <div className="deposit-success-icon">
              <CheckCircle2 size={44} />
            </div>
            <h3>Payout Initiated</h3>
            <p><strong>KES {Number(amountKes).toLocaleString()}</strong> has been dispatched to your {method === 'mpesa' ? 'M-Pesa line' : 'bank account'}.</p>
            <p className="waiting-sub">Reference: {refCode || 'TX-WDR-PROCESSED'}</p>
            <button type="button" className="deposit-submit" style={{ marginTop: 20 }} onClick={reset}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
