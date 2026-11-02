import { useState } from 'react'
import { Activity, ArrowRight, Crown, LoaderCircle, LockKeyhole, Mail, Moon, Phone, ShieldCheck, Sparkles, Sun, UserRound } from 'lucide-react'
import './AuthScreen.css'
import { readApiResponse } from '../api.js'

export default function AuthScreen({ onAuthenticated, onAdminAccess, serviceError, theme, onToggleTheme }) {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const isSignup = mode === 'signup'
      const response = await fetch(isSignup ? '/api/auth/signup' : '/api/auth/signin', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSignup
          ? { fullName: form.fullName, email: form.email, phone: form.phone, password: form.password }
          : { email: form.email, password: form.password }),
      })
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.error || 'Unable to continue. Please try again.')

      onAuthenticated(data.user)
    } catch (requestError) {
      setError(requestError.message || 'Could not reach the TradeX server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  const handleDemoLogin = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.error || 'Failed to sign in to demo.')
      onAuthenticated(data.user)
    } catch (err) {
      setError(err.message || 'Unable to enter demo workspace.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-screen">
      <button className="auth-theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </button>

      <div className="auth-art">
        <div className="auth-art-grid" />
        <div className="auth-orbit auth-orbit-one" />
        <div className="auth-orbit auth-orbit-two" />
        <div className="auth-brand">
          <span className="auth-brand-icon"><Activity size={20} /></span>
          tradex<span>.</span>
          <span className="auth-pro-badge">PRO</span>
        </div>

        <div className="auth-art-copy">
          <span className="auth-kicker"><ShieldCheck size={14} /> INSTITUTIONAL TRADING TERMINAL</span>
          <h1>Trade with clarity.<br />Move with confidence.</h1>
          <p>Institutional-grade execution, live order book intelligence, quantitative risk metrics, and instant multi-currency treasury.</p>
          <div className="auth-art-note">
            <span className="auth-status-dot" /> Ultra-low latency STP market connectivity · Zero fees
          </div>
        </div>

        <div className="auth-art-footer">TradeX Financial Technologies · Global Markets Division</div>
      </div>

      <section className="auth-panel-wrap">
        <div className="auth-form-card">
          <div className="auth-mobile-brand">
            <span className="auth-brand-icon"><Activity size={19} /></span>
            tradex<span>.</span>
          </div>

          <div className="auth-step-label">INSTITUTIONAL WORKSPACE</div>
          <h2>{mode === 'signin' ? 'Welcome back' : 'Create free account'}</h2>
          <p className="auth-form-subtitle">
            {mode === 'signin'
              ? 'Sign in to access your TradeX Pro terminal and portfolio.'
              : 'Create your account for free and start exploring the trading workspace.'}
          </p>

          <div className="auth-mode-tabs" role="tablist" aria-label="Account access">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={mode === 'signin' ? 'selected' : ''}
              onClick={() => switchMode('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? 'selected' : ''}
              onClick={() => switchMode('signup')}
            >
              Create free account
            </button>
          </div>

          {serviceError && <p className="auth-alert" role="alert">{serviceError}</p>}
          {error && <p className="auth-alert" role="alert">{error}</p>}

          <div className="auth-vip-banner">
            <button
              type="button"
              className="auth-demo-action"
              onClick={handleDemoLogin}
              disabled={busy}
            >
              <span className="auth-demo-icon"><Crown size={16} /></span>
              <div className="auth-demo-text">
                <strong>Instant VIP Pro Workspace</strong>
                <small>1-click preview with $250k / KES 32.5M balance</small>
              </div>
              <Sparkles size={16} className="auth-sparkle-icon" />
            </button>
            <div className="auth-divider"><span>or continue with your email</span></div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <label className="auth-field">
                  <span>Full name</span>
                  <span className="auth-input-wrap">
                    <UserRound size={16} />
                    <input
                      autoComplete="name"
                      name="fullName"
                      value={form.fullName}
                      onChange={updateForm}
                      placeholder="e.g. Alex Vance"
                      minLength={2}
                      maxLength={100}
                      required
                    />
                  </span>
                </label>
                <label className="auth-field">
                  <span>Mobile phone number</span>
                  <span className="auth-input-wrap">
                    <Phone size={16} />
                    <input
                      type="tel"
                      autoComplete="tel"
                      name="phone"
                      value={form.phone}
                      onChange={updateForm}
                      placeholder="+254 712 345 678"
                      required
                    />
                  </span>
                  <small>For instant M-Pesa settlements and security verification.</small>
                </label>
              </>
            )}

            <label className="auth-field">
              <span>Email address</span>
              <span className="auth-input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  autoComplete="email"
                  name="email"
                  value={form.email}
                  onChange={updateForm}
                  placeholder="you@tradex.com"
                  maxLength={254}
                  required
                />
              </span>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <span className="auth-input-wrap">
                <LockKeyhole size={16} />
                <input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  name="password"
                  value={form.password}
                  onChange={updateForm}
                  placeholder={mode === 'signin' ? 'Enter your password' : 'At least 12 characters'}
                  minLength={12}
                  maxLength={128}
                  required
                />
              </span>
              {mode === 'signup' && <small>Use at least 12 characters.</small>}
            </label>

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle className="auth-spinner" size={16} />
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {mode === 'signup' ? 'Create Free Account' : 'Sign in to Terminal'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {mode === 'signup' ? (
            <p className="auth-footnote">
              <ShieldCheck size={14} /> 100% Free · No approval fee or credit card required to start.
            </p>
          ) : (
            <p className="auth-footnote">
              <ShieldCheck size={14} /> Secure sign-in with an encrypted, httpOnly session.
            </p>
          )}

          <p className="auth-switch-copy">
            {mode === 'signin' ? 'New to TradeX?' : 'Already have an account?'}
            <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? 'Create free account' : 'Sign in'}
            </button>
          </p>

          {mode === 'signin' && (
            <button className="auth-admin-link" type="button" onClick={onAdminAccess}>
              <ShieldCheck size={13} /> Administrator access
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
