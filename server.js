import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const watchlist = [
  { symbol: 'AAPL', name: 'Apple', price: 214.68, change: 2.41, volume: '29.4M' },
  { symbol: 'NVDA', name: 'NVIDIA', price: 134.25, change: 4.16, volume: '42.7M' },
  { symbol: 'MSFT', name: 'Microsoft', price: 458.12, change: 1.82, volume: '18.2M' },
  { symbol: 'TSLA', name: 'Tesla', price: 231.91, change: -1.08, volume: '33.9M' },
  { symbol: 'AMZN', name: 'Amazon', price: 186.54, change: 0.94, volume: '21.1M' },
  { symbol: 'META', name: 'Meta', price: 518.9, change: 5.8, volume: '18.8M' },
  { symbol: 'AMD', name: 'AMD', price: 169.4, change: 4.3, volume: '24.5M' },
  { symbol: 'SHOP', name: 'Shopify', price: 67.84, change: 3.1, volume: '16.2M' },
]

const portfolio = {
  totalValue: 184640.22,
  dayPL: 3460.12,
  cash: 24320.0,
  buyingPower: 68420,
  netReturn: 18940,
  riskScore: 'Moderate',
  riskLevel: 'Balanced',
  performance: 4.8,
}

const positions = [
  { symbol: 'AAPL', shares: 118, avgCost: 197.4, value: 25353.24 },
  { symbol: 'NVDA', shares: 82, avgCost: 121.8, value: 11011.5 },
  { symbol: 'MSFT', shares: 35, avgCost: 442.7, value: 16034.2 },
]

const topMovers = [
  { symbol: 'META', price: 518.9, change: 5.8, label: 'AI momentum' },
  { symbol: 'AMD', price: 169.4, change: 4.3, label: 'Chip strength' },
  { symbol: 'SHOP', price: 67.84, change: 3.1, label: 'E-commerce' },
]

const transactions = [
  { text: 'Bought NVDA 12 shares', time: '10:42 AM' },
  { text: 'Sold TSLA 4 shares', time: '09:11 AM' },
  { text: 'Dividend received', time: 'Yesterday' },
]

const marketOverview = {
  quote: 'NASDAQ 100',
  value: '18,420.26',
  change: '+1.24%',
  sectors: [
    { name: 'Technology', weight: 42, gain: 2.4 },
    { name: 'Healthcare', weight: 18, gain: 0.9 },
    { name: 'Industrials', weight: 14, gain: 1.2 },
    { name: 'Energy', weight: 9, gain: -0.4 },
  ],
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TradeX API' })
})

app.get('/api/watchlist', (req, res) => {
  res.json(watchlist)
})

app.get('/api/portfolio', (req, res) => {
  res.json(portfolio)
})

app.get('/api/positions', (req, res) => {
  res.json(positions)
})

app.get('/api/movers', (req, res) => {
  res.json(topMovers)
})

app.get('/api/activity', (req, res) => {
  res.json(transactions)
})

app.get('/api/overview', (req, res) => {
  res.json(marketOverview)
})

app.get('/api/quote/:symbol', (req, res) => {
  const { symbol } = req.params
  const item = watchlist.find((entry) => entry.symbol.toLowerCase() === symbol.toLowerCase())

  if (!item) {
    return res.status(404).json({ message: 'Symbol not found' })
  }

  res.json(item)
})

app.post('/api/order', (req, res) => {
  const { symbol, side, quantity } = req.body

  if (!symbol || !side || !quantity || Number(quantity) <= 0) {
    return res.status(400).json({ message: 'Invalid order payload' })
  }

  const asset = watchlist.find((entry) => entry.symbol.toLowerCase() === symbol.toLowerCase())

  if (!asset) {
    return res.status(404).json({ message: 'Asset not found' })
  }

  res.json({
    status: 'accepted',
    order: {
      symbol: asset.symbol,
      side,
      quantity: Number(quantity),
      price: asset.price,
      estimatedValue: (Number(quantity) * asset.price).toFixed(2),
    },
  })
})

app.listen(PORT, () => {
  console.log(`TradeX API running on http://localhost:${PORT}`)
})
