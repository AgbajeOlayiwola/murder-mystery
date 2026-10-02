import { useId, type ReactNode } from 'react'
import { hashSeed } from '../game/rng'
import type { CameraView, Shot } from '../game/types'

/**
 * A CCTV still, drawn rather than shipped. Everything in frame comes from the
 * footage entry, so both detectives see the same picture without any image
 * crossing the wire — and the picture can never disagree with the log line.
 */

const W = 320
const H = 180

/** Night-vision greens, darkest to brightest. */
const C = {
  deep: '#070b09',
  wall: '#111a16',
  mid: '#1a2621',
  edge: '#2a3b34',
  dim: '#3d544a',
  lit: '#7c9e8f',
  hot: '#d4ecdf',
  tag: '#e0bb45',
}

/** Back wall of every indoor room; side walls and floor run to its corners. */
const BACK = { x0: 100, x1: 220, y0: 38, y1: 104 }

export function cameraNumber(camera: string): string {
  return String(1 + (hashSeed(camera) % 16)).padStart(2, '0')
}

export function CctvStill({
  view = 'corridor',
  shot,
  camera,
  at,
  compact = false,
  className = '',
}: {
  view?: CameraView
  shot: Shot
  camera: string
  at: string
  /** Thumbnail mode: no burned-in text, lighter grain. */
  compact?: boolean
  className?: string
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = (name: string) => `${name}-${uid}`
  const seconds = String(hashSeed(`${camera}${at}`) % 60).padStart(2, '0')
  const place = camera.split(' — ')[0]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`block h-auto w-full bg-ink-950 ${className}`}
      role="img"
      aria-label={describeShot(shot, place, at)}
    >
      <defs>
        <filter id={id('grain')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch" seed={hashSeed(at) % 97} />
          <feColorMatrix values="0 0 0 0 0.75  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 1.4 -0.35" />
        </filter>
        <filter id={id('soft')}>
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        <filter id={id('far')}>
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id={id('motion')} x="-30%" width="160%">
          <feGaussianBlur stdDeviation="3 0.4" />
        </filter>
        <radialGradient id={id('vignette')} cx="50%" cy="50%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id={id('glow')}>
          <stop offset="0%" stopColor={C.hot} stopOpacity="0.55" />
          <stop offset="100%" stopColor={C.hot} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.deep} />
          <stop offset="100%" stopColor={C.edge} />
        </linearGradient>
        <pattern id={id('scan')} width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="#000" opacity="0.35" />
        </pattern>
      </defs>

      <g filter={`url(#${id('soft')})`}>
        <Backdrop view={view} sky={`url(#${id('sky')})`} />
        {shot.show === 'light' && (
          <g>
            <ellipse cx="160" cy="62" rx="70" ry="42" fill={`url(#${id('glow')})`} />
            <rect x="146" y="50" width="28" height="22" fill={C.hot} opacity="0.75" />
          </g>
        )}
        {shot.show === 'figures' &&
          shot.xs.map((x, i) => (
            <g key={i} filter={`url(#${id('far')})`} opacity="0.8">
              <Figure x={BACK.x0 + x * (BACK.x1 - BACK.x0)} y={BACK.y1 + 2} scale={0.42} fill="#000" stroke={C.lit} />
            </g>
          ))}
      </g>

      {shot.show === 'figure' && <Subject shot={shot} compact={compact} motion={`url(#${id('motion')})`} />}

      {shot.show === 'rain' && <Rain />}

      <rect width={W} height={H} filter={`url(#${id('grain')})`} opacity={compact ? 0.2 : 0.32} className="cctv-grain" />
      <rect width={W} height={H} fill={`url(#${id('scan')})`} />
      <rect width={W} height={H} fill={`url(#${id('vignette')})`} />

      {!compact && (
        <g fontFamily="ui-monospace, 'SF Mono', Menlo, monospace" fontSize="9" fill={C.hot} opacity="0.9">
          <text x="10" y="17" letterSpacing="1">
            CAM {cameraNumber(camera)} · {place.toUpperCase()}
          </text>
          <circle cx={W - 38} cy="14" r="3" fill="#c1292e" className="cctv-rec" />
          <text x={W - 10} y="17" textAnchor="end" letterSpacing="1">
            REC
          </text>
          <text x="10" y={H - 10} letterSpacing="1">
            {at}:{seconds}
          </text>
          <text x={W - 10} y={H - 10} textAnchor="end" letterSpacing="1" opacity="0.7">
            IR · 2 FPS
          </text>
        </g>
      )}
    </svg>
  )
}

export function describeShot(shot: Shot, place: string, at: string): string {
  const base = `CCTV still, ${place}, ${at}.`
  switch (shot.show) {
    case 'empty':
      return `${base} Nobody in frame.`
    case 'light':
      return `${base} A light is on. Nobody in frame.`
    case 'rain':
      return `${base} Rain on the lens. Nobody in frame.`
    case 'figures':
      return `${base} ${shot.xs.length === 1 ? 'One unidentified figure' : `${shot.xs.length} unidentified figures`} at the far end.`
    case 'figure':
      return `${base} ${shot.tag ? `${shot.tag}, face match ${shot.match ?? '—'}%` : 'An unidentified figure'}${
        shot.heading === 'none' ? ', standing still.' : `, moving ${shot.heading}.`
      }`
  }
}

// ------------------------------------------------------------------ subjects

/** A person, feet at (x, y). Unscaled height is about 84 units. */
function Figure({ x, y, scale = 1, fill, stroke }: { x: number; y: number; scale?: number; fill: string; stroke?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={fill} stroke={stroke} strokeWidth={stroke ? 1.2 : undefined}>
      <circle cx="0" cy="-75" r="8.5" />
      <path d="M -14 -63 Q 0 -69 14 -63 L 17 -30 L 11 -29 L 10 0 L 2 0 L 0 -27 L -2 0 L -10 0 L -11 -29 L -17 -30 Z" />
    </g>
  )
}

function Subject({ shot, compact, motion }: { shot: Extract<Shot, { show: 'figure' }>; compact: boolean; motion: string }) {
  const x = Math.round(shot.x * W)
  const feet = 156
  const moving = shot.heading !== 'none'
  const trail = shot.heading === 'right' ? -1 : 1

  // Face-match box: brackets on the corners, label above.
  const box = { x: x - 25, y: feet - 97, w: 50, h: 101 }
  const label = shot.tag ? `${shot.tag.toUpperCase()}${shot.match ? `  ${shot.match}%` : ''}` : ''
  const labelW = label.length * 5.1 + 10
  const labelX = Math.min(Math.max(box.x, 6), W - labelW - 6)
  const corner = 8

  return (
    <g>
      {moving &&
        [2, 1].map((k) => (
          <g key={k} opacity={0.14 * (3 - k)} filter={motion}>
            <Figure x={x + trail * k * 9} y={feet} fill={C.lit} />
          </g>
        ))}
      <g filter={moving ? motion : undefined}>
        <Figure x={x} y={feet} fill={C.deep} />
        {/* IR catches the rim of a figure more than its face. */}
        <g opacity="0.45">
          <Figure x={x + (moving ? -trail : 1)} y={feet - 1} fill="none" stroke={C.lit} />
        </g>
      </g>
      <ellipse cx={x} cy={feet + 2} rx="20" ry="3.5" fill="#000" opacity="0.4" />

      {shot.tag && (
        <g stroke={C.tag} strokeWidth={compact ? 2.5 : 1.4} fill="none">
          <path
            d={[
              `M ${box.x} ${box.y + corner} V ${box.y} H ${box.x + corner}`,
              `M ${box.x + box.w - corner} ${box.y} H ${box.x + box.w} V ${box.y + corner}`,
              `M ${box.x} ${box.y + box.h - corner} V ${box.y + box.h} H ${box.x + corner}`,
              `M ${box.x + box.w - corner} ${box.y + box.h} H ${box.x + box.w} V ${box.y + box.h - corner}`,
            ].join(' ')}
          />
          {!compact && (
            <>
              <rect x={labelX} y={box.y - 15} width={labelW} height="12" fill="#000" fillOpacity="0.7" strokeWidth="0.8" />
              <text
                x={labelX + 5}
                y={box.y - 6}
                fill={C.tag}
                stroke="none"
                fontFamily="ui-monospace, 'SF Mono', Menlo, monospace"
                fontSize="8"
                letterSpacing="0.3"
              >
                {label}
              </text>
            </>
          )}
        </g>
      )}
    </g>
  )
}

function Rain() {
  const streaks: ReactNode[] = []
  for (let i = 0; i < 70; i++) {
    const x = (i * 53) % (W + 20)
    const y = (i * 97) % (H + 10)
    streaks.push(<line key={i} x1={x} y1={y} x2={x - 4} y2={y + 13} />)
  }
  const drops = [
    [58, 42, 13],
    [240, 120, 17],
    [190, 30, 9],
    [92, 140, 11],
    [286, 64, 8],
  ]
  return (
    <g>
      <g stroke={C.lit} strokeWidth="0.7" opacity="0.28">
        {streaks}
      </g>
      {drops.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={C.hot} opacity="0.07" stroke={C.lit} strokeOpacity="0.25" />
      ))}
    </g>
  )
}

// ---------------------------------------------------------------- backdrops

function Shell({ back = C.wall }: { back?: string }) {
  const { x0, x1, y0, y1 } = BACK
  return (
    <g>
      <rect width={W} height={H} fill={C.deep} />
      <polygon points={`0,0 ${W},0 ${x1},${y0} ${x0},${y0}`} fill={C.deep} />
      <polygon points={`0,0 ${x0},${y0} ${x0},${y1} 0,${H}`} fill={C.mid} />
      <polygon points={`${W},0 ${x1},${y0} ${x1},${y1} ${W},${H}`} fill={C.mid} opacity="0.8" />
      <polygon points={`0,${H} ${x0},${y1} ${x1},${y1} ${W},${H}`} fill={C.edge} />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={back} />
      <g stroke={C.dim} strokeWidth="0.8" opacity="0.7">
        <line x1="0" y1="0" x2={x0} y2={y0} />
        <line x1={W} y1="0" x2={x1} y2={y0} />
        <line x1="0" y1={H} x2={x0} y2={y1} />
        <line x1={W} y1={H} x2={x1} y2={y1} />
      </g>
    </g>
  )
}

/** Lines on the floor running to the vanishing point, for depth. */
function FloorLines() {
  const lines: ReactNode[] = []
  for (let i = 1; i < 6; i++) {
    const t = i / 6
    lines.push(
      <line key={i} x1={t * W} y1={H} x2={BACK.x0 + t * (BACK.x1 - BACK.x0)} y2={BACK.y1} />,
    )
  }
  return (
    <g stroke={C.dim} strokeWidth="0.5" opacity="0.45">
      {lines}
    </g>
  )
}

function Backdrop({ view, sky }: { view: CameraView; sky: string }) {
  const { x0, x1, y0, y1 } = BACK
  switch (view) {
    case 'corridor':
      return (
        <g>
          <Shell />
          <FloorLines />
          {[0.25, 0.55].map((t, i) => (
            <polygon
              key={i}
              points={`${t * x0},${t * y0 + 8} ${t * x0 + 18},${t * y0 + 6 + 5} ${t * x0 + 18},${H - t * (H - y1) - 18} ${t * x0},${H - t * (H - y1) - 8}`}
              fill={C.deep}
              stroke={C.dim}
              strokeWidth="0.6"
            />
          ))}
          {[0.2, 0.5, 0.8].map((t, i) => (
            <rect key={i} x={160 - 30 * (1 - t) - 8} y={y0 * t - 2} width={16 + 40 * (1 - t)} height={3 + 3 * (1 - t)} fill={C.lit} opacity="0.35" />
          ))}
        </g>
      )
    case 'doorway':
      return (
        <g>
          <Shell />
          <FloorLines />
          <rect x="138" y="48" width="44" height={y1 - 48} fill={C.deep} stroke={C.dim} strokeWidth="1.5" />
          <rect x="139" y={y1 - 2} width="42" height="1.5" fill={C.lit} opacity="0.7" />
          <circle cx="175" cy="78" r="1.6" fill={C.lit} />
          <rect x="20" y="50" width="34" height="24" transform="skewY(20)" fill="none" stroke={C.dim} strokeWidth="1" />
        </g>
      )
    case 'shelves': {
      const books: ReactNode[] = []
      for (const [row, shelfY] of [42, 58, 74, 90].entries()) {
        let bx = x0 + 3
        let n = 0
        while (bx < x1 - 4) {
          const w = 2 + ((n * 7 + row * 3) % 3)
          const h = 9 + ((n * 5 + row) % 5)
          books.push(<rect key={`${row}-${n}`} x={bx} y={shelfY + 14 - h} width={w} height={h} fill={n % 4 === 0 ? C.dim : C.edge} />)
          bx += w + 1
          n++
        }
      }
      return (
        <g>
          <Shell back={C.deep} />
          <FloorLines />
          {books}
          <g stroke={C.dim} strokeWidth="1">
            {[56, 72, 88, 104].map((y) => (
              <line key={y} x1={x0} y1={y} x2={x1} y2={y} />
            ))}
          </g>
          <g stroke={C.dim} strokeWidth="0.8" opacity="0.6">
            {[0.3, 0.5, 0.7, 0.9].map((t) => (
              <line key={t} x1={0} y1={H * (1 - t) + 10} x2={x0} y2={y0 + (y1 - y0) * (1 - t) + 4} />
            ))}
          </g>
        </g>
      )
    }
    case 'racks': {
      const bottles: ReactNode[] = []
      for (let r = 0; r < 6; r++) {
        for (let k = 0; k < 13; k++) {
          bottles.push(<circle key={`${r}-${k}`} cx={x0 + 6 + k * 9 + (r % 2) * 4} cy={y0 + 7 + r * 10} r="2.6" fill={C.deep} stroke={C.dim} strokeWidth="0.6" />)
        }
      }
      return (
        <g>
          <Shell />
          <FloorLines />
          {bottles}
          <path d={`M 0 22 Q 160 -18 ${W} 22`} fill="none" stroke={C.dim} strokeWidth="1.2" />
          <path d={`M ${x0} ${y0} Q 160 ${y0 - 22} ${x1} ${y0}`} fill="none" stroke={C.dim} strokeWidth="0.8" />
        </g>
      )
    }
    case 'arches':
      return (
        <g>
          <Shell />
          {[112, 146, 180].map((ax) => (
            <path key={ax} d={`M ${ax} ${y1} V 66 Q ${ax + 14} 40 ${ax + 28} 66 V ${y1}`} fill={C.deep} stroke={C.dim} strokeWidth="1" />
          ))}
          <rect x="155" y="52" width="10" height="3" fill={C.lit} opacity="0.4" />
          {[0, 1, 2, 3].map((i) => {
            const y = y1 + 10 + i * 17
            const spread = 40 + i * 22
            return <rect key={i} x={160 - spread - 30} y={y} width={spread * 2 + 60} height={5 + i} fill={C.deep} stroke={C.dim} strokeWidth="0.5" />
          })}
        </g>
      )
    case 'vehicles':
      return (
        <g>
          <Shell />
          <FloorLines />
          <g stroke={C.dim} strokeWidth="0.8">
            {[48, 56, 64, 72, 80, 88, 96].map((y) => (
              <line key={y} x1={x0 + 10} y1={y} x2={x1 - 10} y2={y} />
            ))}
          </g>
          {[
            [18, 132, 1],
            [214, 140, 1.1],
          ].map(([cx, cy, s], i) => (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${s})`}>
              <path d="M 0 20 L 4 6 Q 20 -6 44 -6 Q 66 -6 76 6 L 88 10 L 88 22 L 0 22 Z" fill={C.deep} stroke={C.dim} strokeWidth="0.8" />
              <circle cx="18" cy="23" r="7" fill="#000" stroke={C.dim} />
              <circle cx="70" cy="23" r="7" fill="#000" stroke={C.dim} />
            </g>
          ))}
        </g>
      )
    case 'stair':
      return (
        <g>
          <Shell />
          {Array.from({ length: 9 }, (_, i) => {
            const y = H - 8 - i * 12
            const x = 70 + i * 16
            return <polygon key={i} points={`${x},${y} ${W},${y} ${W},${y + 12} ${x - 6},${y + 12}`} fill={i % 2 ? C.mid : C.edge} stroke={C.dim} strokeWidth="0.5" />
          })}
          <line x1="64" y1={H - 40} x2={W} y2="10" stroke={C.lit} strokeWidth="1.6" opacity="0.55" />
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1={70 + i * 32} y1={H - 16 - i * 24} x2={64 + i * 32} y2={H - 42 - i * 23} stroke={C.dim} strokeWidth="0.8" />
          ))}
        </g>
      )
    case 'glass':
      return (
        <g>
          <rect width={W} height={H} fill={sky} />
          <polygon points={`0,${H} 40,110 280,110 ${W},${H}`} fill={C.edge} />
          <g stroke={C.dim} strokeWidth="2">
            {[40, 100, 160, 220, 280].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="110" />
            ))}
            <line x1="0" y1="110" x2={W} y2="110" />
            <line x1="0" y1="60" x2={W} y2="60" strokeWidth="1" />
          </g>
          {[
            [30, 100, 22],
            [120, 104, 14],
            [270, 98, 26],
          ].map(([cx, cy, r], i) => (
            <g key={i} fill={C.deep}>
              <ellipse cx={cx} cy={cy - r / 2} rx={r} ry={r * 0.8} />
              <rect x={cx - 8} y={cy} width="16" height="12" />
            </g>
          ))}
        </g>
      )
    case 'water':
      return (
        <g>
          <rect width={W} height="90" fill={sky} />
          <rect y="88" width={W} height={H - 88} fill={C.mid} />
          <g stroke={C.lit} strokeWidth="0.6" opacity="0.3">
            {Array.from({ length: 14 }, (_, i) => {
              const y = 94 + i * 6
              const x = (i * 71) % 220
              return <line key={i} x1={x} y1={y} x2={x + 30 + i * 4} y2={y} />
            })}
          </g>
          <polygon points={`150,${H} 120,${H} 150,88 162,88`} fill={C.edge} stroke={C.dim} strokeWidth="0.6" />
          <path d="M 190 118 Q 240 132 300 118 L 292 108 L 198 108 Z" fill={C.deep} stroke={C.dim} strokeWidth="0.8" />
          {[20, 90, 230, 300].map((x) => (
            <rect key={x} x={x} y="20" width="5" height={x < 150 ? 96 : 80} fill={C.deep} />
          ))}
          <rect width={W} height="22" fill={C.deep} />
        </g>
      )
    case 'garden':
      return (
        <g>
          <rect width={W} height={H} fill={sky} />
          <rect y="44" width={W} height="58" fill={C.mid} />
          <g stroke={C.edge} strokeWidth="0.6">
            {Array.from({ length: 7 }, (_, r) => (
              <line key={r} x1="0" y1={52 + r * 8} x2={W} y2={52 + r * 8} />
            ))}
          </g>
          <rect x="146" y="58" width="28" height="44" fill={C.deep} />
          <polygon points={`0,${H} 0,102 ${W},102 ${W},${H}`} fill={C.edge} />
          <polygon points={`110,${H} 150,102 170,102 210,${H}`} fill={C.dim} opacity="0.6" />
          {[
            [34, 100, 36],
            [92, 104, 22],
            [236, 102, 30],
            [298, 106, 38],
          ].map(([cx, cy, r], i) => (
            <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.55} fill={C.deep} />
          ))}
        </g>
      )
  }
}
