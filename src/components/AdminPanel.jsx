import { useEffect, useMemo, useState }                                                                from 'react'
import { ArrowLeft, LoaderCircle, LockKeyhole, LogOut, RefreshCw, Search, ShieldCheck, Trash2, Users } from 'lucide-react'
import './AdminPanel.css'

async function readResponse(response) {
  const data = response.status === 204 ? {} : await response.json()
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.')
  return data
}

export default function AdminPanel({ onBack }) {
  const [authenticated, setAuthenticated] = useState(null)
  const [password, setPassword] = useState('')
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    fetch('/api/admin/session', { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 401) return false
        await readResponse(response)
        return true
      })
      .then((isAuthenticated) => {
        if (active) {
          setAuthenticated(isAuthenticated)
          if (!isAuthenticated) setRefreshing(false)
        }
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Unable to check admin access.')
        setAuthenticated(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!authenticated) return undefined
    let active = true
    fetch('/api/admin/users', { credentials: 'include' })
      .then(readResponse)
      .then((data) => {
        if (active) {
          setUsers(data.users)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load users.')
      })
      .finally(() => {
        if (active) setRefreshing(false)
      })

    return () => {
      active = false
    }
  }, [authenticated, refreshKey])

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => `${user.fullName} ${user.email} ${user.phone}`.toLowerCase().includes(query))
  }, [users, search])

  const handleSignIn = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const response = await fetch('/api/admin/signin', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      await readResponse(response)
      setPassword('')
      setRefreshing(true)
      setAuthenticated(true)
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in to admin.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.fullName} (${user.email})? Their account and active sessions will be removed.`)) return

    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      await readResponse(response)
      setUsers((current) => current.filter((entry) => entry.id !== user.id))
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete this user.')
    } finally {
      setBusy(false)
    }
  }

  const handleSignOut = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/signout', {
        method: 'POST',
        credentials: 'include',
      })
      await readResponse(response)
      setAuthenticated(false)
      setUsers([])
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign out of admin.')
    } finally {
      setBusy(false)
    }
  }

  if (authenticated === null) {
    return <section className="admin-screen admin-loading"><LoaderCircle className="admin-spinner" size={20} /> Checking admin access...</section>
  }

  if (!authenticated) {
    return (
      <section className="admin-screen admin-login-screen">
        <div className="admin-login-card">
          {onBack && <button className="admin-back-link" type="button" onClick={onBack}><ArrowLeft size={15} /> Back to TradeX</button>}
          <span className="admin-lock-icon"><ShieldCheck size={22} /></span>
          <div className="admin-eyebrow">RESTRICTED AREA</div>
          <h1>Administrator sign in</h1>
          <p>Use your separate admin password to manage TradeX accounts.</p>
          {error && <div className="admin-alert" role="alert">{error}</div>}
          <form onSubmit={handleSignIn}>
            <label htmlFor="admin-password">Admin password</label>
            <span className="admin-password-field"><LockKeyhole size={16} /><input id="admin-password" type="password" autoComplete="current-password" minLength={16} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required /></span>
            <button className="admin-primary-button" type="submit" disabled={busy}>
              {busy ? <><LoaderCircle className="admin-spinner" size={16} /> Signing in...</> : 'Open admin panel'}
            </button>
          </form>
          <div className="admin-security-note"><LockKeyhole size={14} /> Admin access is separate from member sign-in.</div>
        </div>
      </section>
    )
  }

  return (
    <section className="admin-screen">
      <div className="admin-heading-row">
        <div>
          <div className="admin-eyebrow"><ShieldCheck size={14} /> ADMINISTRATION</div>
          <h1>User management</h1>
          <p>Review registered accounts and remove accounts that should no longer have access.</p>
        </div>
        <div className="admin-actions">
          <button className="admin-secondary-button" type="button" onClick={() => { setRefreshing(true); setRefreshKey((key) => key + 1) }} disabled={refreshing || busy}>
            <RefreshCw size={15} className={refreshing ? 'admin-spinner' : ''} /> Refresh
          </button>
          <button className="admin-secondary-button" type="button" onClick={handleSignOut} disabled={busy}><LogOut size={15} /> Sign out</button>
        </div>
      </div>

      <div className="admin-summary-card">
        <span className="admin-summary-icon"><Users size={18} /></span>
        <div><small>REGISTERED USERS</small><strong>{users.length}</strong></div>
      </div>

      {error && <div className="admin-alert" role="alert">{error}</div>}
      <div className="admin-users-card">
        <div className="admin-table-heading">
          <div><h2>Accounts</h2><p>Account deletion also revokes all active sessions.</p></div>
          <label className="admin-search"><Search size={15} /><input aria-label="Search users" placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>USER</th><th>PHONE</th><th>BALANCE</th><th>JOINED</th><th><span className="admin-visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.fullName}</strong><small>{user.email}</small></td>
                  <td>{user.phone}</td>
                  <td>KES {Number(user.balanceKes).toLocaleString()}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td><button className="admin-delete-button" type="button" aria-label={`Delete ${user.fullName}`} disabled={busy} onClick={() => handleDelete(user)}><Trash2 size={15} /> Delete</button></td>
                </tr>
              ))}
              {visibleUsers.length === 0 && <tr><td className="admin-empty" colSpan="5">{refreshing ? 'Loading accounts...' : search ? 'No users match your search.' : 'No registered users yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
