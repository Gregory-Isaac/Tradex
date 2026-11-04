import { useState, useMemo } from 'react'
import {
  AreaChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart
} from 'recharts'
import { SlidersHorizontal, Sparkles } from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '../utils/currencies.js'
import './CandleChart.css'

export default function CandleChart({ asset, range = '1W', onRangeChange, currency = 'USD' }) {
  const [chartMode, setChartMode] = useState('area') // 'area' | 'candles'
  const [showIndicators, setShowIndicators] = useState(true)
  const [hoverData, setHoverData] = useState(null)

  // Generate realistic OHLC + volume time series data based on asset and range
  const data = useMemo(() => {
    const count = range === '1D' ? 24 : range === '1W' ? 36 : range === '1M' ? 30 : 48
    const basePrice = asset?.price || 67482.16
    const volatility = asset?.kind === 'crypto' ? 0.024 : 0.012

    let currentPrice = basePrice * (1 - (count * 0.004))
    const list = []

    for (let i = 0; i < count; i++) {
      const pseudo1 = ((Math.sin(i * 12.9898) + 1) / 2)
      const pseudo2 = ((Math.cos(i * 78.233) + 1) / 2)
      const swing = (Math.sin(i * 0.6) + Math.cos(i * 0.3) + (pseudo1 - 0.45) * 1.5) * (basePrice * volatility)
      const open = Math.round(currentPrice)
      const close = Math.round(open + swing)
      const high = Math.round(Math.max(open, close) + pseudo1 * (basePrice * volatility * 0.5))
      const low = Math.round(Math.min(open, close) - pseudo2 * (basePrice * volatility * 0.5))
      const volume = Math.round(Math.abs(swing * 12) + (basePrice * 0.8))
      const isUp = close >= open

      // Calculate simple EMA approximations
      const ema20 = Math.round(close * 0.985 + (Math.sin(i * 0.4) * (basePrice * 0.01)))
      const ema50 = Math.round(close * 0.97 + (Math.sin(i * 0.2) * (basePrice * 0.015)))

      const label = range === '1D' 
        ? `${String(i).padStart(2, '0')}:00` 
        : `Oct ${String((i % 30) + 1).padStart(2, '0')}`

      list.push({
        label,
        open,
        high,
        low,
        close,
        volume,
        isUp,
        ema20,
        ema50,
        // For custom candlestick rendering in composed chart
        bottom: Math.min(open, close),
        height: Math.max(1, Math.abs(close - open)),
        wickBottom: low,
        wickHeight: high - low,
      })

      currentPrice = close
    }

    return list
  }, [asset?.price, asset?.kind, range])

  const activePoint = hoverData || data[data.length - 1] || {}

  return (
    <div className="pro-chart-wrapper">
      {/* Chart Top Controls & Live OHLC HUD */}
      <div className="chart-hud-row">
        <div className="chart-ohlc-hud">
          <span className="hud-badge"><Sparkles size={11} /> PRO FEED</span>
          <span className="hud-item"><small>O</small><b>{formatCurrency(activePoint.open || 0, currency)}</b></span>
          <span className="hud-item"><small>H</small><b className="positive">{formatCurrency(activePoint.high || 0, currency)}</b></span>
          <span className="hud-item"><small>L</small><b className="negative">{formatCurrency(activePoint.low || 0, currency)}</b></span>
          <span className="hud-item"><small>C</small><b>{formatCurrency(activePoint.close || 0, currency)}</b></span>
          <span className="hud-item"><small>VOL</small><b>{formatCompactCurrency(activePoint.volume || 0, currency)}</b></span>
        </div>

        <div className="chart-toggles">
          <div className="mode-toggle">
            <button
              className={chartMode === 'area' ? 'active' : ''}
              onClick={() => setChartMode('area')}
            >
              Area
            </button>
            <button
              className={chartMode === 'candles' ? 'active' : ''}
              onClick={() => setChartMode('candles')}
            >
              Candles
            </button>
          </div>

          <button
            className={`indicator-btn ${showIndicators ? 'active' : ''}`}
            onClick={() => setShowIndicators(!showIndicators)}
            title="Toggle EMA 20 & EMA 50 Indicators"
          >
            <SlidersHorizontal size={13} />
            <span>EMA 20/50</span>
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="chart-canvas-area">
        <ResponsiveContainer width="100%" height={230}>
          {chartMode === 'area' ? (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onMouseMove={(e) => {
                if (e.activePayload?.[0]?.payload) {
                  setHoverData(e.activePayload[0].payload)
                }
              }}
              onMouseLeave={() => setHoverData(null)}
            >
              <defs>
                <linearGradient id="proAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="90%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                domain={['dataMin - 100', 'dataMax + 100']}
                tickFormatter={(v) => formatCompactCurrency(v, currency)}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#proAreaGrad)"
                activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
              {showIndicators && (
                <>
                  <Line type="monotone" dataKey="ema20" stroke="#f59e0b" strokeWidth={1.2} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="ema50" stroke="#38bdf8" strokeWidth={1.2} dot={false} strokeDasharray="4 4" />
                </>
              )}
            </AreaChart>
          ) : (
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onMouseMove={(e) => {
                if (e.activePayload?.[0]?.payload) {
                  setHoverData(e.activePayload[0].payload)
                }
              }}
              onMouseLeave={() => setHoverData(null)}
            >
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                domain={['dataMin - 100', 'dataMax + 100']}
                tickFormatter={(v) => formatCompactCurrency(v, currency)}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              {/* Candlestick body */}
              <Bar
                dataKey="height"
                shape={<CandleShape />}
                isAnimationActive={false}
              />
              {showIndicators && (
                <>
                  <Line type="monotone" dataKey="ema20" stroke="#f59e0b" strokeWidth={1.4} dot={false} />
                  <Line type="monotone" dataKey="ema50" stroke="#38bdf8" strokeWidth={1.4} dot={false} />
                </>
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Indicator Legend */}
      <div className="chart-legend-strip">
        <div className="legend-items">
          <span className="legend-dot price-dot"><i /> Price</span>
          {showIndicators && (
            <>
              <span className="legend-dot ema20-dot"><i /> EMA 20 (Momentum)</span>
              <span className="legend-dot ema50-dot"><i /> EMA 50 (Trend)</span>
            </>
          )}
        </div>
        <div className="timeframe-selector">
          {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((r) => (
            <button
              key={r}
              className={range === r ? 'tf-active' : ''}
              onClick={() => onRangeChange?.(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function CandleShape(props) {
  const { x, width, payload, yAxis } = props
  if (!payload || !yAxis) return null

  const { open, close, high, low, isUp } = payload
  const color = isUp ? '#10b981' : '#f43f5e'

  const yHigh = yAxis.scale(high)
  const yLow = yAxis.scale(low)
  const yOpen = yAxis.scale(open)
  const yClose = yAxis.scale(close)

  const bodyTop = Math.min(yOpen, yClose)
  const bodyHeight = Math.max(2, Math.abs(yClose - yOpen))
  const candleWidth = Math.max(4, Math.min(width * 0.7, 14))
  const candleX = x + (width - candleWidth) / 2
  const wickX = x + width / 2

  return (
    <g>
      {/* Center wick */}
      <line
        x1={wickX}
        y1={yHigh}
        x2={wickX}
        y2={yLow}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Candle Body */}
      <rect
        x={candleX}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={color}
        rx={1}
      />
    </g>
  )
}

function CustomTooltip({ active, payload, currency }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  const isUp = d.close >= d.open

  return (
    <div className="pro-chart-tooltip">
      <div className="tooltip-head">
        <span>{d.label}</span>
        <span className={isUp ? 'positive' : 'negative'}>
          {isUp ? '+' : ''}{(((d.close - d.open) / d.open) * 100).toFixed(2)}%
        </span>
      </div>
      <div className="tooltip-grid">
        <div><span>Open:</span> <b>{formatCurrency(d.open, currency)}</b></div>
        <div><span>High:</span> <b className="positive">{formatCurrency(d.high, currency)}</b></div>
        <div><span>Low:</span> <b className="negative">{formatCurrency(d.low, currency)}</b></div>
        <div><span>Close:</span> <b>{formatCurrency(d.close, currency)}</b></div>
        <div><span>Volume:</span> <span>{formatCompactCurrency(d.volume, currency)}</span></div>
      </div>
    </div>
  )
}
