import type { ZoneDurationsMs } from '@/lib/wearables/types'

export type WorkoutShareMetrics = {
  totalLbs: number | null
  strain: number | null
  strainScaleMax: number | null
  durationMs: number | null
  averageHeartRate?: number | null
  maxHeartRate?: number | null
  zoneDurations?: ZoneDurationsMs | null
  dateLabel?: string | null
}

/** Format like Strava: 36m 7s / 1h 12m */
export function formatShareDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return s > 0 ? `${h}h ${m}m` : `${h}h ${m}m`
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`
  return `${s}s`
}

export function formatShareVolume(lbs: number): string {
  if (!Number.isFinite(lbs) || lbs <= 0) return '—'
  return `${Math.round(lbs).toLocaleString('en-US')} lbs`
}

/**
 * Whoop does not expose continuous HR. Build a simplified bpm polyline from
 * zone time buckets + avg/max so the share card can show a Strava-like chart.
 */
export function buildSimplifiedHrSeries(params: {
  averageHeartRate?: number | null
  maxHeartRate?: number | null
  zoneDurations?: ZoneDurationsMs | null
  pointCount?: number
}): number[] {
  const avg = params.averageHeartRate && params.averageHeartRate > 40 ? params.averageHeartRate : 120
  const max = params.maxHeartRate && params.maxHeartRate > avg ? params.maxHeartRate : Math.round(avg * 1.25)
  const floor = Math.max(60, Math.round(avg * 0.72))
  const n = Math.max(24, params.pointCount ?? 48)

  const zones = params.zoneDurations
  const zoneMs = zones
    ? [zones.zone0, zones.zone1, zones.zone2, zones.zone3, zones.zone4, zones.zone5]
    : null
  const totalZone = zoneMs ? zoneMs.reduce((a, b) => a + b, 0) : 0

  const zoneBpms = [
    floor,
    Math.round(floor + (avg - floor) * 0.35),
    Math.round(floor + (avg - floor) * 0.7),
    avg,
    Math.round(avg + (max - avg) * 0.55),
    max,
  ]

  const coarse: number[] = []
  if (zoneMs && totalZone > 0) {
    // Sequential zone blocks (simplified stand-in for a true time series)
    for (let z = 0; z < 6; z++) {
      const share = zoneMs[z] / totalZone
      const steps = Math.max(1, Math.round(share * n))
      for (let i = 0; i < steps; i++) {
        const wobble = Math.sin(i * 0.9 + z) * (3 + z)
        coarse.push(zoneBpms[z] + wobble)
      }
    }
  } else {
    // Warm-up → peak → cool-down arc from avg/max only
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      let bpm: number
      if (t < 0.15) {
        bpm = floor + (avg - floor) * (t / 0.15)
      } else if (t < 0.55) {
        const u = (t - 0.15) / 0.4
        bpm = avg + (max - avg) * Math.sin(u * Math.PI * 0.85)
      } else if (t < 0.85) {
        const u = (t - 0.55) / 0.3
        bpm = max - (max - avg) * u * 0.7 + Math.sin(u * 8) * 4
      } else {
        const u = (t - 0.85) / 0.15
        bpm = avg * (1 - u) + floor * 1.05 * u
      }
      coarse.push(bpm)
    }
  }

  // Resample + light smooth
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const idx = (i / (n - 1)) * (coarse.length - 1)
    const lo = Math.floor(idx)
    const hi = Math.min(coarse.length - 1, lo + 1)
    const t = idx - lo
    const raw = coarse[lo] * (1 - t) + coarse[hi] * t
    const prev = out[i - 1] ?? raw
    out.push(prev * 0.35 + raw * 0.65)
  }
  return out
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawHrChart(
  ctx: CanvasRenderingContext2D,
  series: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  if (series.length < 2) return
  const min = Math.min(...series) * 0.96
  const max = Math.max(...series) * 1.04
  const range = Math.max(1, max - min)
  const pts = series.map((bpm, i) => ({
    x: x + (i / (series.length - 1)) * w,
    y: y + h - ((bpm - min) / range) * h,
  }))

  // Soft fill under the line
  const grad = ctx.createLinearGradient(0, y, 0, y + h)
  grad.addColorStop(0, 'rgba(255, 92, 40, 0.28)')
  grad.addColorStop(1, 'rgba(255, 92, 40, 0)')
  ctx.beginPath()
  ctx.moveTo(pts[0].x, y + h)
  for (const p of pts) ctx.lineTo(p.x, p.y)
  ctx.lineTo(pts[pts.length - 1].x, y + h)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const cur = pts[i]
    const cx = (prev.x + cur.x) / 2
    ctx.quadraticCurveTo(prev.x, prev.y, cx, (prev.y + cur.y) / 2)
  }
  const last = pts[pts.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.strokeStyle = color
  ctx.lineWidth = 10
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
}

/**
 * Renders a 1080×1920 Story-style PNG (black, stacked metrics, HR chart, JACKED mark).
 */
export async function renderWorkoutSharePng(metrics: WorkoutShareMetrics): Promise<Blob> {
  const W = 1080
  const H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  try {
    await document.fonts.ready
  } catch {
    /* ignore */
  }

  // Background
  ctx.fillStyle = '#050505'
  ctx.fillRect(0, 0, W, H)
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.2, 40, W * 0.5, H * 0.35, W * 0.9)
  bg.addColorStop(0, '#141414')
  bg.addColorStop(1, '#050505')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const padX = 96
  let y = 220

  const metricFont = '"FF DIN", "Barlow Condensed", "Arial Narrow", sans-serif'
  const labelFont = '"Neue Haas Grotesk Text", Inter, system-ui, sans-serif'
  const brandFont = '"Good Times", "FF DIN", sans-serif'
  const accent = '#ff5c28'

  const rows: { label: string; value: string }[] = []
  if (metrics.totalLbs != null && metrics.totalLbs > 0) {
    rows.push({ label: 'Volume', value: formatShareVolume(metrics.totalLbs) })
  }
  if (metrics.strain != null && Number.isFinite(metrics.strain)) {
    const scale = metrics.strainScaleMax && metrics.strainScaleMax > 0 ? ` / ${metrics.strainScaleMax}` : ''
    rows.push({
      label: 'Strain',
      value: `${Number(metrics.strain.toFixed(1))}${scale}`,
    })
  }
  if (metrics.durationMs != null && metrics.durationMs > 0) {
    rows.push({ label: 'Time', value: formatShareDuration(metrics.durationMs) })
  }

  for (const row of rows) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = `500 36px ${labelFont}`
    ctx.fillText(row.label, padX, y)
    y += 88
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 96px ${metricFont}`
    ctx.fillText(row.value, padX, y)
    y += 120
  }

  // Heart rate chart block
  const series = buildSimplifiedHrSeries({
    averageHeartRate: metrics.averageHeartRate,
    maxHeartRate: metrics.maxHeartRate,
    zoneDurations: metrics.zoneDurations,
  })
  const hasHr =
    (metrics.averageHeartRate != null && metrics.averageHeartRate > 0) ||
    (metrics.maxHeartRate != null && metrics.maxHeartRate > 0) ||
    (metrics.zoneDurations != null &&
      Object.values(metrics.zoneDurations).some((v) => v > 0))

  if (hasHr && series.length) {
    y += 40
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = `500 36px ${labelFont}`
    ctx.fillText('Heart rate', padX, y)
    y += 36

    const chartH = 280
    const chartW = W - padX * 2
    roundRect(ctx, padX, y, chartW, chartH + 40, 24)
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.fill()

    drawHrChart(ctx, series, padX + 24, y + 28, chartW - 48, chartH, accent)

    y += chartH + 70
    if (metrics.averageHeartRate || metrics.maxHeartRate) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = `500 28px ${labelFont}`
      const bits = [
        metrics.averageHeartRate ? `Avg ${metrics.averageHeartRate}` : null,
        metrics.maxHeartRate ? `Max ${metrics.maxHeartRate}` : null,
      ].filter(Boolean)
      ctx.fillText(bits.join('  ·  '), padX, y)
    }
  }

  // Brand
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 64px ${brandFont}`
  ctx.textAlign = 'center'
  ctx.fillText('JACKED', W / 2, H - 160)
  ctx.textAlign = 'left'

  if (metrics.dateLabel) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = `500 26px ${labelFont}`
    ctx.textAlign = 'center'
    ctx.fillText(metrics.dateLabel, W / 2, H - 100)
    ctx.textAlign = 'left'
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to encode PNG'))
    }, 'image/png')
  })
}

export async function downloadWorkoutSharePng(
  metrics: WorkoutShareMetrics,
  filename = 'jacked-workout.png'
): Promise<void> {
  const blob = await renderWorkoutSharePng(metrics)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
