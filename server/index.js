import { randomBytes, scrypt as scryptCallback, createHash, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { setImmediate as scheduleImmediate } from 'node:timers'
import { promisify } from 'node:util'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import express from 'express'
import Database from 'better-sqlite3'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

const scrypt = promisify(scryptCallback)
const app = express()
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envFile = path.join(rootDirectory, '.env')

if (existsSync(envFile)) {
  process.loadEnvFile(envFile)
}

const databasePath = process.env.TRADEX_DB_PATH || path.join(rootDirectory, 'server', 'data', 'tradex.sqlite')
mkdirSync(path.dirname(databasePath), { recursive: true })

const database = new Database(databasePath)
database.pragma('journal_mode = WAL')
database.pragma('foreign_keys = ON')
database.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    balance_kes INTEGER NOT NULL DEFAULT 0,
    payment_receipt TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mpesa_deposits (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    amount_kes INTEGER NOT NULL CHECK (amount_kes > 0),
    phone TEXT NOT NULL,
    checkout_request_id TEXT UNIQUE,
    merchant_request_id TEXT,
    status TEXT NOT NULL,
    callback_amount INTEGER,
    callback_phone TEXT,
    receipt TEXT UNIQUE,
    last_query_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions(expires_at);
  CREATE INDEX IF NOT EXISTS mpesa_deposits_account_idx ON mpesa_deposits(account_id, created_at);
`)

const now = Date.now()
database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now)
database.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(now)

const mpesaDepositExpiryMs = 10 * 60 * 1000
const sessionExpiryMs = 7 * 24 * 60 * 60 * 1000
const adminSessionExpiryMs = 2 * 60 * 60 * 1000
const isProduction = process.env.NODE_ENV === 'production'
const sessionCookieName = isProduction ? '__Host-tradex_session' : 'tradex_session'
const adminCookieName = isProduction ? '__Host-tradex_admin' : 'tradex_admin'
const adminPassword = process.env.TRADEX_ADMIN_PASSWORD
const adminPasswordSalt = randomBytes(16)
const adminPasswordHash = typeof adminPassword === 'string' && adminPassword.length >= 16 && adminPassword.length <= 128
  ? scrypt(adminPassword, adminPasswordSalt, 64)
  : null

class HttpError extends Error {
  constructor(status, message, { expose = false } = {}) {
    super(message)
    this.status = status
    this.expose = expose || status < 500
  }
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const normalizeEmail = (value) => value.trim().toLowerCase()

function normalizeKenyanPhone(value) {
  const phone = value.trim().replace(/[\s()-]/g, '')
  const digits = phone.startsWith('+') ? phone.slice(1) : phone

  if (/^0[17]\d{8}$/.test(digits)) {
    return `254${digits.slice(1)}`
  }

  if (/^254[17]\d{8}$/.test(digits)) {
    return digits
  }

  throw new HttpError(400, 'Enter a valid Kenyan mobile number, such as 0712 345 678.')
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map((part) => {
      const separator = part.indexOf('=')
      if (separator < 0) return ['', '']
      return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]
    }).filter(([key]) => key),
  )
}

function sendSessionCookie(response, token) {
  const secure = isProduction ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionExpiryMs / 1000}${secure}`,
  )
}

function clearSessionCookie(response) {
  const secure = isProduction ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
  )
}

function sendAdminSessionCookie(response, token) {
  const secure = isProduction ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${adminCookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${adminSessionExpiryMs / 1000}${secure}`,
  )
}

function clearAdminSessionCookie(response) {
  const secure = isProduction ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${adminCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
  )
}

function publicAccount(account) {
  return {
    id: account.id,
    fullName: account.full_name,
    email: account.email,
    phone: account.phone,
    balanceKes: account.balance_kes,
  }
}

async function createSession(response, accountId) {
  const token = randomBytes(32).toString('base64url')
  const createdAt = Date.now()
  database.prepare(
    'INSERT INTO sessions (token_hash, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
  ).run(sha256(token), accountId, createdAt, createdAt + sessionExpiryMs)
  sendSessionCookie(response, token)
}

function getSessionAccount(request) {
  const token = parseCookies(request.headers.cookie)[sessionCookieName]
  if (!token) return null

  const session = database.prepare(`
    SELECT accounts.*, sessions.token_hash, sessions.expires_at
    FROM sessions
    JOIN accounts ON accounts.id = sessions.account_id
    WHERE sessions.token_hash = ?
  `).get(sha256(token))

  if (!session) return null
  if (session.expires_at <= Date.now()) {
    database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(session.token_hash)
    return null
  }

  return session
}

function getAdminSession(request) {
  const token = parseCookies(request.headers.cookie)[adminCookieName]
  if (!token) return null

  const session = database.prepare('SELECT * FROM admin_sessions WHERE token_hash = ?').get(sha256(token))
  if (!session) return null
  if (session.expires_at <= Date.now()) {
    database.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(session.token_hash)
    return null
  }

  return session
}

function requireAdmin(request) {
  if (!getAdminSession(request)) throw new HttpError(401, 'Admin sign-in is required.')
}

async function createAdminSession(response) {
  const token = randomBytes(32).toString('base64url')
  const createdAt = Date.now()
  database.prepare(
    'INSERT INTO admin_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)',
  ).run(sha256(token), createdAt, createdAt + adminSessionExpiryMs)
  sendAdminSessionCookie(response, token)
}

function getDarajaConfig() {
  const missing = [
    'DARAJA_CONSUMER_KEY',
    'DARAJA_CONSUMER_SECRET',
    'DARAJA_SHORTCODE',
    'DARAJA_PASSKEY',
    'DARAJA_CALLBACK_URL',
  ].filter((key) => !process.env[key])

  if (missing.length) {
    throw new HttpError(503, `M-Pesa payments are not configured. Add ${missing.join(', ')} to the server .env file.`, { expose: true })
  }

  let callbackUrl
  try {
    callbackUrl = new URL(process.env.DARAJA_CALLBACK_URL)
  } catch {
    throw new HttpError(503, 'The M-Pesa callback URL is not configured correctly.', { expose: true })
  }

  if (callbackUrl.protocol !== 'https:') {
    throw new HttpError(503, 'The M-Pesa callback URL must use HTTPS.', { expose: true })
  }

  if (callbackUrl.pathname !== '/api/payments/mpesa/callback' || callbackUrl.search || callbackUrl.hash) {
    throw new HttpError(503, 'The M-Pesa callback URL must end exactly with /api/payments/mpesa/callback and must not include query parameters.', { expose: true })
  }

  const callbackHost = callbackUrl.hostname.toLowerCase()
  if (
    callbackHost === 'localhost'
    || callbackHost === '127.0.0.1'
    || callbackHost === '0.0.0.0'
    || callbackHost.endsWith('.localhost')
    || callbackHost.endsWith('.local')
    || callbackHost.endsWith('.example')
  ) {
    throw new HttpError(503, 'The M-Pesa callback URL must use a publicly reachable host, not a local or example address.', { expose: true })
  }

  const environment = process.env.DARAJA_ENV || 'sandbox'
  if (!['sandbox', 'production'].includes(environment)) {
    throw new HttpError(503, 'DARAJA_ENV must be sandbox or production.', { expose: true })
  }

  const transactionType = process.env.DARAJA_TRANSACTION_TYPE || 'CustomerPayBillOnline'
  if (!['CustomerPayBillOnline', 'CustomerBuyGoodsOnline'].includes(transactionType)) {
    throw new HttpError(503, 'DARAJA_TRANSACTION_TYPE must be CustomerPayBillOnline or CustomerBuyGoodsOnline.', { expose: true })
  }

  return {
    baseUrl: environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke',
    callbackUrl: callbackUrl.toString(),
    shortcode: process.env.DARAJA_SHORTCODE,
    passkey: process.env.DARAJA_PASSKEY,
    consumerKey: process.env.DARAJA_CONSUMER_KEY,
    consumerSecret: process.env.DARAJA_CONSUMER_SECRET,
    transactionType,
  }
}

async function requestProviderJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) })
  let body

  try {
    body = await response.json()
  } catch {
    throw new HttpError(502, 'M-Pesa returned an unreadable response. Please try again.')
  }

  if (!response.ok) {
    console.error('M-Pesa request failed with HTTP status', response.status)
    if ([401, 403].includes(response.status)) {
      throw new HttpError(502, 'M-Pesa rejected the Daraja credentials. Check DARAJA_CONSUMER_KEY and DARAJA_CONSUMER_SECRET in the server .env file.', { expose: true })
    }
    if (response.status === 400) {
      throw new HttpError(502, 'M-Pesa rejected the request. Check the shortcode, passkey, transaction type, phone number, and registered callback URL.', { expose: true })
    }
    throw new HttpError(502, 'M-Pesa could not process the request. Please try again later.')
  }

  return body
}

async function getDarajaAccessToken(config) {
  const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')
  const body = await requestProviderJson(
    `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } },
  )

  if (!body.access_token) {
    throw new HttpError(502, 'M-Pesa did not issue an access token. Check the Daraja consumer key and secret in the server .env file.', { expose: true })
  }

  return body.access_token
}

function getDarajaTimestamp() {
  const nairobiTime = new Date(Date.now() + 3 * 60 * 60 * 1000)
  return [
    nairobiTime.getUTCFullYear(),
    String(nairobiTime.getUTCMonth() + 1).padStart(2, '0'),
    String(nairobiTime.getUTCDate()).padStart(2, '0'),
    String(nairobiTime.getUTCHours()).padStart(2, '0'),
    String(nairobiTime.getUTCMinutes()).padStart(2, '0'),
    String(nairobiTime.getUTCSeconds()).padStart(2, '0'),
  ].join('')
}

async function initiateStkPush(config, phone, amountKes, accountReference) {
  const accessToken = await getDarajaAccessToken(config)
  const timestamp = getDarajaTimestamp()
  const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64')
  const body = await requestProviderJson(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: config.transactionType,
      Amount: amountKes,
      PartyA: phone,
      PartyB: config.shortcode,
      PhoneNumber: phone,
      CallBackURL: config.callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: 'TX deposit',
    }),
  })

  if (String(body.ResponseCode) !== '0' || !body.CheckoutRequestID || !body.MerchantRequestID) {
    console.error('M-Pesa did not accept the STK request', body.errorCode || body.ResponseCode || 'unknown response')
    throw new HttpError(502, 'M-Pesa did not accept the payment prompt. Check the shortcode, passkey, phone number, and transaction type.', { expose: true })
  }

  return body
}

async function queryStkStatus(config, checkoutRequestId) {
  const accessToken = await getDarajaAccessToken(config)
  const timestamp = getDarajaTimestamp()
  const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64')

  return requestProviderJson(`${config.baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  })
}

app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },
}))
app.use(express.json({ limit: '16kb' }))

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})
const depositLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/api/auth/me', (request, response) => {
  const account = getSessionAccount(request)
  if (!account) return response.status(401).json({ error: 'Sign in to continue.' })
  return response.json({ user: publicAccount(account) })
})

app.post('/api/auth/signup', signupLimiter, async (request, response) => {
  const { fullName, email, phone: rawPhone, password } = request.body || {}
  if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
    throw new HttpError(400, 'Enter your full name.')
  }
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new HttpError(400, 'Enter a valid email address.')
  }
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    throw new HttpError(400, 'Use a password between 12 and 128 characters.')
  }

  const normalizedEmail = normalizeEmail(email)
  const phone = normalizeKenyanPhone(typeof rawPhone === 'string' ? rawPhone : '')
  if (database.prepare('SELECT 1 FROM accounts WHERE email = ?').get(normalizedEmail)) {
    throw new HttpError(409, 'An account with this email already exists. Sign in instead.')
  }

  const passwordSalt = randomBytes(16).toString('hex')
  const passwordHash = (await scrypt(password, passwordSalt, 64)).toString('hex')
  const accountId = randomBytes(16).toString('hex')
  const receipt = `TX_FREE_JOIN_${randomBytes(6).toString('hex').toUpperCase()}`
  const createdAt = Date.now()

  database.prepare(`
    INSERT INTO accounts (
      id, email, full_name, phone, password_hash, password_salt, balance_kes, payment_receipt, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    accountId,
    normalizedEmail,
    fullName.trim(),
    phone,
    passwordHash,
    passwordSalt,
    0,
    receipt,
    createdAt,
  )

  await createSession(response, accountId)
  const account = database.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId)
  return response.status(201).json({
    status: 'created',
    user: publicAccount(account),
    message: 'Your free TradeX account is ready.',
  })
})

app.post('/api/auth/signin', loginLimiter, async (request, response) => {
  const { email, password } = request.body || {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'Enter your email and password.')
  }

  const account = database.prepare('SELECT * FROM accounts WHERE email = ?').get(normalizeEmail(email))
  if (!account) throw new HttpError(401, 'Email or password is incorrect.')

  const passwordHash = (await scrypt(password, account.password_salt, 64)).toString('hex')
  const actual = Buffer.from(passwordHash, 'hex')
  const expected = Buffer.from(account.password_hash, 'hex')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new HttpError(401, 'Email or password is incorrect.')
  }

  await createSession(response, account.id)
  return response.json({ user: publicAccount(account) })
})

app.post('/api/auth/signout', (request, response) => {
  const token = parseCookies(request.headers.cookie)[sessionCookieName]
  if (token) database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token))
  clearSessionCookie(response)
  return response.status(204).end()
})

async function ensureDemoAccount() {
  const existing = database.prepare('SELECT id FROM accounts WHERE email = ?').get('alex.vance@tradex.pro')
  if (!existing) {
    const salt = randomBytes(16).toString('hex')
    const hash = (await scrypt('TradeX2026!Elite', salt, 64)).toString('hex')
    database.prepare(`
      INSERT INTO accounts (id, email, full_name, phone, password_hash, password_salt, balance_kes, payment_receipt, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'demo-vip-account',
      'alex.vance@tradex.pro',
      'Alex Vance (PRO)',
      '254712345678',
      hash,
      salt,
      32500000,
      'MPESA_DEMO_VIP_RECEIPT',
      Date.now(),
    )
  }
}
ensureDemoAccount().catch(console.error)

app.post('/api/auth/demo', async (request, response) => {
  await ensureDemoAccount()
  const account = database.prepare('SELECT * FROM accounts WHERE email = ?').get('alex.vance@tradex.pro')
  if (!account) throw new HttpError(500, 'Unable to initialize VIP Demo account.')
  await createSession(response, account.id)
  return response.json({ user: publicAccount(account) })
})

app.post('/api/wallet/deposit', depositLimiter, async (request, response) => {
  const account = getSessionAccount(request)
  if (!account) throw new HttpError(401, 'Please sign in to deposit.')
  const { amountKes: rawAmount, phone: rawPhone } = request.body || {}
  const amountKes = Number(rawAmount)
  if (!Number.isSafeInteger(amountKes) || amountKes < 1 || amountKes > 250000) {
    throw new HttpError(400, 'Enter a whole-number deposit between KES 1 and KES 250,000.')
  }
  const phone = normalizeKenyanPhone(typeof rawPhone === 'string' ? rawPhone : account.phone)
  const config = getDarajaConfig()
  const id = randomBytes(12).toString('hex').toUpperCase()
  const createdAt = Date.now()

  database.prepare(`
    INSERT INTO mpesa_deposits (id, account_id, amount_kes, phone, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, account.id, amountKes, phone, 'initiating', createdAt, createdAt)

  try {
    const stk = await initiateStkPush(config, phone, amountKes, `TX${id.slice(0, 10)}`)
    database.prepare(`
      UPDATE mpesa_deposits
      SET checkout_request_id = ?, merchant_request_id = ?, status = ?, updated_at = ?
      WHERE id = ? AND status = ?
    `).run(stk.CheckoutRequestID, stk.MerchantRequestID, 'pending', Date.now(), id, 'initiating')

    return response.status(202).json({
      status: 'pending',
      checkoutRequestId: stk.CheckoutRequestID,
      customerMessage: stk.CustomerMessage || 'Check your phone and approve the M-Pesa prompt.',
    })
  } catch (error) {
    database.prepare('UPDATE mpesa_deposits SET status = ?, updated_at = ? WHERE id = ? AND status = ?')
      .run('failed', Date.now(), id, 'initiating')
    throw error
  }
})

app.get('/api/wallet/deposits', (request, response) => {
  const account = getSessionAccount(request)
  if (!account) throw new HttpError(401, 'Please sign in to view M-Pesa deposits.')

  const deposits = database.prepare(`
    SELECT amount_kes, status, receipt, created_at
    FROM mpesa_deposits
    WHERE account_id = ?
    ORDER BY created_at DESC
    LIMIT 25
  `).all(account.id).map((deposit) => ({
    amountKes: deposit.amount_kes,
    status: deposit.status,
    receipt: deposit.receipt,
    createdAt: deposit.created_at,
  }))

  return response.json({ deposits })
})

const creditMpesaDeposit = database.transaction((payment) => {
  const current = database.prepare('SELECT * FROM mpesa_deposits WHERE id = ?').get(payment.id)
  if (!current || current.status !== 'verifying') return current?.status || 'failed'

  const balanceUpdate = database.prepare('UPDATE accounts SET balance_kes = balance_kes + ? WHERE id = ?')
    .run(current.amount_kes, current.account_id)
  if (balanceUpdate.changes !== 1) throw new Error('The deposit account no longer exists.')

  database.prepare('UPDATE mpesa_deposits SET status = ?, updated_at = ? WHERE id = ? AND status = ?')
    .run('completed', Date.now(), current.id, 'verifying')
  return 'completed'
})

async function verifyMpesaDeposit(paymentId) {
  const payment = database.prepare('SELECT * FROM mpesa_deposits WHERE id = ?').get(paymentId)
  if (!payment || payment.status !== 'verifying' || !payment.checkout_request_id) return payment?.status
  if (Date.now() - payment.created_at > mpesaDepositExpiryMs) {
    database.prepare('UPDATE mpesa_deposits SET status = ?, updated_at = ? WHERE id = ? AND status = ?')
      .run('expired', Date.now(), payment.id, 'verifying')
    return 'expired'
  }
  if (Date.now() - (payment.last_query_at || 0) < 4000) return payment.status

  database.prepare('UPDATE mpesa_deposits SET last_query_at = ? WHERE id = ?')
    .run(Date.now(), payment.id)
  const result = await queryStkStatus(getDarajaConfig(), payment.checkout_request_id)
  if (String(result.ResponseCode) !== '0' || result.ResultCode === undefined) return payment.status

  if (String(result.ResultCode) !== '0') {
    database.prepare('UPDATE mpesa_deposits SET status = ?, updated_at = ? WHERE id = ? AND status = ?')
      .run('failed', Date.now(), payment.id, 'verifying')
    return 'failed'
  }

  if (
    payment.callback_amount !== payment.amount_kes
    || payment.callback_phone !== payment.phone
    || !payment.receipt
  ) {
    database.prepare('UPDATE mpesa_deposits SET status = ?, updated_at = ? WHERE id = ? AND status = ?')
      .run('failed', Date.now(), payment.id, 'verifying')
    console.error('M-Pesa deposit callback metadata did not match the payment', payment.id)
    return 'failed'
  }

  return creditMpesaDeposit(payment)
}

function resumeMpesaVerification(paymentId) {
  const retry = async () => {
    try {
      const status = await verifyMpesaDeposit(paymentId)
      if (status !== 'verifying') return
    } catch (error) {
      console.error('Unable to verify M-Pesa deposit status', error.message)
    }

    const retryTimer = setTimeout(retry, 5000)
    retryTimer.unref()
  }

  scheduleImmediate(retry)
}

app.get('/api/wallet/deposits/:checkoutRequestId', async (request, response) => {
  const account = getSessionAccount(request)
  if (!account) throw new HttpError(401, 'Please sign in to check this deposit.')

  const payment = database.prepare(`
    SELECT * FROM mpesa_deposits WHERE checkout_request_id = ? AND account_id = ?
  `).get(request.params.checkoutRequestId, account.id)
  if (!payment) throw new HttpError(404, 'M-Pesa deposit was not found.')

  if (['initiating', 'pending', 'verifying'].includes(payment.status)
    && Date.now() - payment.created_at > mpesaDepositExpiryMs) {
    database.prepare(`
      UPDATE mpesa_deposits SET status = ?, updated_at = ?
      WHERE id = ? AND status IN (?, ?, ?)
    `).run('expired', Date.now(), payment.id, 'initiating', 'pending', 'verifying')
    payment.status = 'expired'
  }

  if (payment.status === 'verifying') {
    try {
      await verifyMpesaDeposit(payment.id)
    } catch (error) {
      console.error('Unable to verify M-Pesa deposit status', error.message)
    }
  }

  const updatedPayment = database.prepare('SELECT * FROM mpesa_deposits WHERE id = ?').get(payment.id)
  const payload = {
    status: updatedPayment.status,
    amountKes: updatedPayment.amount_kes,
    receipt: updatedPayment.receipt,
  }
  if (updatedPayment.status === 'completed') {
    const updatedAccount = database.prepare('SELECT balance_kes FROM accounts WHERE id = ?').get(account.id)
    payload.balanceKes = updatedAccount?.balance_kes ?? 0
  }
  if (['failed', 'expired'].includes(updatedPayment.status)) {
    payload.message = updatedPayment.status === 'expired'
      ? 'This M-Pesa request expired. Start a new deposit.'
      : 'The payment was not completed. You can start a new deposit.'
  }
  return response.json(payload)
})

app.post('/api/wallet/withdraw', (request, response) => {
  const account = getSessionAccount(request)
  if (!account) throw new HttpError(401, 'Please sign in to withdraw.')
  const { amountKes } = request.body || {}
  const amount = Math.floor(Number(amountKes))
  if (!amount || amount <= 0 || amount > account.balance_kes) {
    throw new HttpError(400, 'Insufficient funds for withdrawal.')
  }
  database.prepare('UPDATE accounts SET balance_kes = balance_kes - ? WHERE id = ?').run(amount, account.id)
  const updated = database.prepare('SELECT * FROM accounts WHERE id = ?').get(account.id)
  return response.json({ success: true, balanceKes: updated.balance_kes })
})

app.get('/api/admin/session', (request, response) => {
  if (!getAdminSession(request)) return response.status(401).json({ error: 'Admin sign-in is required.' })
  return response.json({ authenticated: true })
})

app.post('/api/admin/signin', adminLoginLimiter, async (request, response) => {
  if (!adminPasswordHash) {
    throw new HttpError(503, 'Admin access is not configured. Set TRADEX_ADMIN_PASSWORD to a unique 16–128 character password and restart the server.')
  }

  const { password } = request.body || {}
  if (typeof password !== 'string' || password.length < 16 || password.length > 128) {
    throw new HttpError(401, 'Admin password is incorrect.')
  }

  const actual = Buffer.from(await scrypt(password, adminPasswordSalt, 64))
  const expected = Buffer.from(await adminPasswordHash)
  if (!timingSafeEqual(actual, expected)) throw new HttpError(401, 'Admin password is incorrect.')

  await createAdminSession(response)
  return response.json({ authenticated: true })
})

app.post('/api/admin/signout', (request, response) => {
  const token = parseCookies(request.headers.cookie)[adminCookieName]
  if (token) database.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(sha256(token))
  clearAdminSessionCookie(response)
  return response.status(204).end()
})

app.get('/api/admin/users', (request, response) => {
  requireAdmin(request)
  const users = database.prepare(`
    SELECT id, full_name, email, phone, balance_kes, created_at
    FROM accounts
    ORDER BY created_at DESC
  `).all().map((account) => ({
    id: account.id,
    fullName: account.full_name,
    email: account.email,
    phone: account.phone,
    balanceKes: account.balance_kes,
    createdAt: account.created_at,
  }))

  return response.json({ users })
})

app.delete('/api/admin/users/:id', (request, response) => {
  requireAdmin(request)
  const { id } = request.params
  if (!/^[a-f0-9]{32}$/i.test(id)) throw new HttpError(400, 'Invalid user ID.')

  const result = database.prepare('DELETE FROM accounts WHERE id = ?').run(id)
  if (result.changes === 0) throw new HttpError(404, 'User not found.')
  return response.status(204).end()
})

app.post('/api/payments/mpesa/callback', (request, response) => {
  const callback = request.body?.Body?.stkCallback
  if (!callback?.CheckoutRequestID || callback.ResultCode === undefined) {
    return response.status(400).json({ error: 'Invalid M-Pesa callback payload.' })
  }

  const payment = database.prepare('SELECT * FROM mpesa_deposits WHERE checkout_request_id = ?')
    .get(callback.CheckoutRequestID)
  if (!payment || ['completed', 'failed', 'expired'].includes(payment.status)) {
    return response.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
  if (callback.MerchantRequestID && callback.MerchantRequestID !== payment.merchant_request_id) {
    console.error('M-Pesa merchant request ID did not match the pending payment', payment.id)
    return response.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }

  if (String(callback.ResultCode) !== '0') {
    database.prepare(`
      UPDATE mpesa_deposits SET status = ?, updated_at = ? WHERE id = ? AND status IN (?, ?)
    `).run('failed', Date.now(), payment.id, 'pending', 'verifying')
    return response.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }

  const metadata = callback.CallbackMetadata?.Item
  const itemValue = (name) => metadata?.find((item) => item.Name === name)?.Value
  const amount = Number(itemValue('Amount'))
  const phone = String(itemValue('PhoneNumber') || '')
  const receipt = itemValue('MpesaReceiptNumber')

  if (amount !== payment.amount_kes || phone !== payment.phone || typeof receipt !== 'string' || !receipt) {
    database.prepare(`
      UPDATE mpesa_deposits SET status = ?, updated_at = ? WHERE id = ? AND status IN (?, ?)
    `).run('failed', Date.now(), payment.id, 'pending', 'verifying')
    console.error('M-Pesa callback metadata did not match the pending payment', payment.id)
    return response.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }

  database.prepare(`
    UPDATE mpesa_deposits
    SET status = ?, callback_amount = ?, callback_phone = ?, receipt = ?, updated_at = ?
    WHERE id = ? AND status IN (?, ?)
  `).run('verifying', amount, phone, receipt, Date.now(), payment.id, 'pending', 'verifying')

  resumeMpesaVerification(payment.id)

  return response.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

app.use('/api', (_request, response) => response.status(404).json({ error: 'API endpoint not found.' }))

const staticDirectory = path.join(rootDirectory, 'dist')
if (existsSync(staticDirectory)) {
  app.use(express.static(staticDirectory, { index: false, maxAge: isProduction ? '1h' : 0 }))
  app.use((request, response, next) => {
    if (request.method !== 'GET' || !request.accepts('html')) return next()
    return response.sendFile(path.join(staticDirectory, 'index.html'))
  })
}

app.use((error, _request, response, _next) => {
  void _next
  const status = Number.isInteger(error.status) ? error.status : 500
  if (status >= 500) console.error('TradeX server error:', error.message)
  return response.status(status).json({
    error: error.expose ? error.message : 'The request could not be completed. Please try again later.',
  })
})

const port = Number(process.env.PORT || 4179)
export const server = app.listen(port, () => {
  console.log(`TradeX API listening on port ${port}`)
})
