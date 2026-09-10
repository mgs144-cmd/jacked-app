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
    for (let z = 0; z < 6; z++) {
      const share = zoneMs[z] / totalZone
      const steps = Math.max(1, Math.round(share * n))
      for (let i = 0; i < steps; i++) {
        const wobble = Math.sin(i * 0.9 + z) * (3 + z)
        coarse.push(zoneBpms[z] + wobble)
      }
    }
  } else {
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
  ctx.lineWidth = 8
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
}

/**
 * Compact Story PNG — big strain, white HR line, JACKED + lifting.com.
 * Shorter canvas so more of the card is content, less empty black.
 */
export async function renderWorkoutSharePng(metrics: WorkoutShareMetrics): Promise<Blob> {
  const W = 1080
  const H = 1350
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

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, W, H)

  const padX = 88
  let y = 120

  const displayFont = '"Good Times", "FF DIN", Impact, sans-serif'
  const metricFont = '"FF DIN", "Barlow Condensed", "Arial Narrow", sans-serif'
  const labelFont = '"FF DIN", "Barlow Condensed", system-ui, sans-serif'

  // Hero strain
  if (metrics.strain != null && Number.isFinite(metrics.strain)) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = `500 34px ${labelFont}`
    ctx.fillText('STRAIN', padX, y)
    y += 40

    const score =
      Number.isInteger(metrics.strain) ? String(metrics.strain) : Number(metrics.strain).toFixed(1)
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 220px ${metricFont}`
    ctx.fillText(score, padX, y + 190)
    y += 230

    if (metrics.strainScaleMax && metrics.strainScaleMax > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = `500 36px ${labelFont}`
      ctx.fillText(`/ ${metrics.strainScaleMax}`, padX, y)
      y += 56
    }
  }

  // Secondary metrics row
  const secondary: { label: string; value: string }[] = []
  if (metrics.totalLbs != null && metrics.totalLbs > 0) {
    secondary.push({ label: 'VOLUME', value: formatShareVolume(metrics.totalLbs) })
  }
  if (metrics.durationMs != null && metrics.durationMs > 0) {
    secondary.push({ label: 'TIME', value: formatShareDuration(metrics.durationMs) })
  }

  if (secondary.length) {
    y += 20
    let x = padX
    for (const row of secondary) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.font = `500 26px ${labelFont}`
      ctx.fillText(row.label, x, y)
      ctx.fillStyle = '#ffffff'
      ctx.font = `700 56px ${metricFont}`
      ctx.fillText(row.value, x, y + 64)
      x += 420
    }
    y += 110
  }

  const series = buildSimplifiedHrSeries({
    averageHeartRate: metrics.averageHeartRate,
    maxHeartRate: metrics.maxHeartRate,
    zoneDurations: metrics.zoneDurations,
  })
  const hasHr =
    (metrics.averageHeartRate != null && metrics.averageHeartRate > 0) ||
    (metrics.maxHeartRate != null && metrics.maxHeartRate > 0) ||
    (metrics.zoneDurations != null && Object.values(metrics.zoneDurations).some((v) => v > 0))

  if (hasHr && series.length) {
    y += 24
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = `500 28px ${labelFont}`
    ctx.fillText('HEART RATE', padX, y)
    y += 28

    const chartH = 200
    const chartW = W - padX * 2
    drawHrChart(ctx, series, padX, y, chartW, chartH, '#ffffff')
    y += chartH + 48

    ctx.fillStyle = '#ffffff'
    ctx.font = `700 42px ${metricFont}`
    const hrBits = [
      metrics.averageHeartRate ? `AVG ${metrics.averageHeartRate}` : null,
      metrics.maxHeartRate ? `MAX ${metrics.maxHeartRate}` : null,
    ].filter(Boolean)
    ctx.fillText(hrBits.join('    '), padX, y)
    y += 40
  }

  // Brand — higher on the canvas (less empty bottom)
  y = Math.max(y + 48, H - 160)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 56px ${displayFont}`
  const brand = 'JACKED'
  ctx.fillText(brand, padX, y)
  const brandW = ctx.measureText(brand).width
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = `500 28px ${labelFont}`
  ctx.fillText('lifting.com', padX + brandW + 14, y - 4)

  if (metrics.dateLabel) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = `500 24px ${labelFont}`
    ctx.fillText(metrics.dateLabel, padX, y + 40)
  }

  // Crop canvas to content bottom so the file itself is shorter when possible
  const contentBottom = Math.min(H, Math.max(y + 70, 900))
  const outCanvas = document.createElement('canvas')
  outCanvas.width = W
  outCanvas.height = contentBottom
  const outCtx = outCanvas.getContext('2d')
  if (!outCtx) throw new Error('Canvas unavailable')
  outCtx.drawImage(canvas, 0, 0)

  return new Promise((resolve, reject) => {
    outCanvas.toBlob((blob) => {
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
