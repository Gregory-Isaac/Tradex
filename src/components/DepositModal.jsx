import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, LoaderCircle, Phone, ShieldCheck, X, Zap } from 'lucide-react'
import { readApiResponse } from '../api.js'
import { playAudio } from '../utils/audio.js'
import './DepositModal.css'

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

export default function DepositModal({ isOpen, onClose, user, onDepositSuccess }) {
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone || '')
  const [kesAmount, setKesAmount] = useState('5000')
  const [step, setStep] = useState('form')
  const [payment, setPayment] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    if (!isOpen || !payment) return undefined
    let active = true

    const pollPayment = async () => {
      while (active) {
        await wait(2500)
        if (!active) return

        try {
          const response = await fetch(`/api/wallet/deposits/${encodeURIComponent(payment.checkoutRequestId)}`, {
            credentials: 'include',
          })
          const data = await readApiResponse(response)

          if (!response.ok) {
            if (response.status === 401 || response.status === 404) {
              setError(data.error || 'Unable to find this M-Pesa deposit. Please sign in and try again.')
              setPayment(null)
              setStep('form')
              return
            }
            throw new Error(data.error || 'We are still waiting for M-Pesa confirmation.')
          }

          if (data.status === 'completed') {
            if (!active) return
            setReceipt({ code: data.receipt, amountKes: data.amountKes, time: new Date().toLocaleTimeString() })
            onDepositSuccess?.(data.balanceKes)
            playAudio('success')
            setPayment(null)
            setStep('success')
            return
          }

          if (data.status === 'failed' || data.status === 'expired') {
            setError(data.message || 'The M-Pesa payment was not completed.')
            setPayment(null)
            setStep('form')
            return
          }

          setError('Waiting for M-Pesa to confirm your payment. Keep this window open.')
        } catch (pollError) {
          if (active) setError(pollError.message || 'Connection interrupted. Still checking payment status.')
        }
      }
    }

    pollPayment()
    return () => { active = false }
  }, [isOpen, payment, onDepositSuccess])

  if (!isOpen) return null

  const handleMpesaDeposit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountKes: Number(kesAmount), phone: mpesaPhone }),
      })
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.error || 'Unable to start the M-Pesa payment.')

      setPayment({ checkoutRequestId: data.checkoutRequestId })
      setStep('waiting')
      setError('')
    } catch (requestError) {
      setError(requestError.message || 'Could not reach the payment service. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const close = () => {
    if (step === 'success') {
      setStep('form')
      setReceipt(null)
    }
    setError('')
    onClose()
  }

  return (
    <div className="deposit-backdrop" onClick={close} role="presentation">
      <div className="deposit-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="deposit-title">
        <div className="deposit-modal-header">
          <div className="deposit-header-copy">
            <span className="deposit-kicker"><ShieldCheck size={13} /> SECURE M-PESA PAYMENT</span>
            <h2 id="deposit-title">Deposit funds</h2>
          </div>
          <button className="deposit-close" onClick={close} aria-label="Close deposit dialog"><X size={18} /></button>
        </div>

        {step === 'form' && (
          <div className="deposit-body">
            <form onSubmit={handleMpesaDeposit} className="deposit-form">
              <div className="deposit-field">
                <label htmlFor="deposit-phone">M-Pesa mobile number</label>
                <div className="deposit-input-box">
                  <Phone size={16} />
                  <input
                    id="deposit-phone"
                    type="tel"
                    autoComplete="tel"
                    value={mpesaPhone}
                    onChange={(event) => setMpesaPhone(event.target.value)}
                    placeholder="0712 345 678"
                    required
                  />
                </div>
              </div>

              <div className="deposit-field">
                <div className="deposit-label-row">
                  <label htmlFor="deposit-amount">Amount in KES</label>
                  <span className="deposit-usd-equiv">KES 1 – 250,000</span>
                </div>
                <div className="deposit-input-box">
                  <span className="currency-prefix">KES</span>
                  <input
                    id="deposit-amount"
                    type="number"
                    min="1"
                    max="250000"
                    step="1"
                    value={kesAmount}
                    onChange={(event) => setKesAmount(event.target.value)}
                    required
                  />
                </div>
                <div className="deposit-chips">
                  {[100, 500, 1000, 2500, 5000, 10000, 25000].map((amount) => (
                    <button key={amount} type="button" className={Number(kesAmount) === amount ? 'chip-active' : ''} onClick={() => setKesAmount(String(amount))}>
                      KES {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="deposit-error" role="alert">{error}</p>}

              <div className="deposit-note" style={{ background: 'rgba(0, 226, 103, 0.08)', borderColor: 'rgba(0, 226, 103, 0.25)', color: '#c2decb' }}>
                <Zap size={14} className="deposit-note-icon" style={{ color: 'var(--b-green)' }} />
                <span>Paybill: <b>290290</b> · 0% Transaction Fees. STK Push will prompt for your M-PESA PIN immediately.</span>
              </div>

              <button type="submit" className="deposit-submit" disabled={busy}>
                {busy ? <LoaderCircle className="spinner" size={17} /> : <>Send M-Pesa prompt <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>
        )}

        {step === 'waiting' && (
          <div className="deposit-waiting-state" aria-live="polite">
            <LoaderCircle className="deposit-big-spinner" size={48} />
            <h3>Approve the M-Pesa prompt</h3>
            <p>Enter your M-Pesa PIN to pay <strong>KES {Number(kesAmount).toLocaleString()}</strong> from {mpesaPhone}.</p>
            <p className="waiting-sub">{error || 'Waiting for payment confirmation…'}</p>
            <button type="button" className="deposit-close-waiting" onClick={close}>Close window</button>
          </div>
        )}

        {step === 'success' && (
          <div className="deposit-success-state">
            <div className="deposit-success-icon"><CheckCircle2 size={44} /></div>
            <h3>Deposit confirmed</h3>
            <p>Your wallet was credited with <strong>KES {receipt?.amountKes.toLocaleString()}</strong>.</p>
            <div className="deposit-receipt-card">
              <div><span>M-Pesa receipt</span><strong>{receipt?.code}</strong></div>
              <div><span>Status</span><strong className="status-complete">Completed</strong></div>
              <div><span>Time</span><span>{receipt?.time}</span></div>
            </div>
            <button type="button" className="deposit-submit" onClick={close}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
