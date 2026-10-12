// Animated road scene for the login screen: skyline, sky traffic and a busy highway. Pure CSS animation, no libraries.
import type { CSSProperties, ReactNode } from 'react'

const far = [
  [0, 70], [38, 110], [70, 60], [104, 130], [150, 90], [190, 120], [236, 70], [270, 100],
  [310, 140], [356, 80], [396, 115], [440, 65], [480, 105], [520, 85], [560, 125], [600, 75],
]
const near = [
  [0, 90], [46, 140], [90, 70], [130, 160], [190, 100], [236, 130], [290, 80], [340, 150],
  [392, 95], [440, 135], [496, 75], [548, 120], [600, 90],
]
const stars = [[8, 10], [18, 28], [30, 14], [42, 34], [55, 8], [66, 24], [78, 12], [88, 30], [94, 16], [24, 44], [72, 42], [50, 22]]

function Skyline({ blocks, widths, base, fill }: { blocks: number[][]; widths: number[]; base: number; fill: string }) {
  // Drawn twice side by side so the loop is seamless.
  return (
    <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="h-full w-1/2 shrink-0" aria-hidden="true">
      {blocks.map(([x, h], i) => (
        <rect key={i} x={x * 2} y={base - h} width={widths[i % widths.length]} height={h} fill={fill} />
      ))}
      {blocks.map(([x, h], i) => (
        <g key={`w${i}`}>
          {[0, 1, 2].map((r) => (
            <rect key={r} x={x * 2 + 10} y={base - h + 14 + r * 22} width={8} height={8} fill="#ffc04d" opacity={(i + r) % 3 === 0 ? 0.55 : 0.12} />
          ))}
        </g>
      ))}
    </svg>
  )
}

/* A thing that crosses the whole scene. Starts off-screen so it stays hidden when motion is reduced. */
function Mover({
  dir, seconds, delay, style, children,
}: { dir: 'right' | 'left'; seconds: number; delay: number; style: CSSProperties; children: ReactNode }) {
  return (
    <div
      className="absolute"
      style={{
        left: '-40%',
        animation: `${dir === 'right' ? 'ts-pass-right' : 'ts-pass-left'} ${seconds}s linear ${delay}s infinite`,
        ...style,
      }}
    >
      {/* Oncoming traffic is mirrored so it faces left. */}
      <div style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }}>{children}</div>
    </div>
  )
}

export default function LoginScene() {
  return (
    <div className="relative h-full min-h-72 overflow-hidden bg-gradient-to-b from-ink-900 via-ink-800 to-[#7a3a14]" aria-hidden="true">
      {stars.map(([x, y], i) => (
        <span key={i} className="ts-star absolute h-1 w-1 rounded-full bg-white" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 6) * 0.5}s` }} />
      ))}

      {/* sun glow */}
      <div className="absolute bottom-[28%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="absolute bottom-[32%] left-[62%] h-16 w-16 rounded-full bg-brand-300" />

      {/* clouds and a plane */}
      <Mover dir="right" seconds={80} delay={-20} style={{ top: '34%' }}><Cloud w={110} /></Mover>
      <Mover dir="right" seconds={110} delay={-70} style={{ top: '48%' }}><Cloud w={80} /></Mover>
      <Mover dir="left" seconds={26} delay={-6} style={{ top: '16%' }}><Plane /></Mover>

      {/* skylines */}
      <div className="absolute inset-x-0 bottom-[26%] h-[32%] overflow-hidden opacity-60">
        <div className="ts-skyline-far flex h-full w-[200%]">
          <Skyline blocks={far} widths={[44, 52, 40, 60]} base={200} fill="#1e3350" />
          <Skyline blocks={far} widths={[44, 52, 40, 60]} base={200} fill="#1e3350" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-[24%] h-[32%] overflow-hidden">
        <div className="ts-skyline-near flex h-full w-[200%]">
          <Skyline blocks={near} widths={[64, 80, 56, 90]} base={200} fill="#0a1424" />
          <Skyline blocks={near} widths={[64, 80, 56, 90]} base={200} fill="#0a1424" />
        </div>
      </div>

      {/* road */}
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[#0a1424]">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-500/60" />
        <div
          className="ts-road absolute inset-x-0 top-[44%] h-1.5"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, #ffc04d 0 48px, transparent 48px 96px)' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20" />
      </div>

      {/* oncoming lane (far, small, going left) */}
      <Mover dir="left" seconds={7} delay={0} style={{ bottom: '17%', zIndex: 5 }}><Car color="#ef4444" w={70} /></Mover>
      <Mover dir="left" seconds={11} delay={-3} style={{ bottom: '17%', zIndex: 5 }}><Bus color="#38bdf8" w={120} /></Mover>
      <Mover dir="left" seconds={9} delay={-6} style={{ bottom: '17%', zIndex: 5 }}><BoxTruck color="#e2e8f0" w={105} /></Mover>
      <Mover dir="left" seconds={13} delay={-9} style={{ bottom: '17%', zIndex: 5 }}><Pickup color="#10b981" w={80} /></Mover>

      {/* main truck */}
      <div className="ts-drive-in absolute bottom-[7%] left-1/2 z-10 w-56 -translate-x-1/2 sm:w-72">
        <div className="ts-bob">
          <MainTruck />
        </div>
        <div className="absolute -left-2 top-[48%] space-y-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="ts-speed block h-0.5 w-8 rounded bg-white/70" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
      </div>

      {/* our lane, nearest to the viewer: cars overtaking the truck */}
      <Mover dir="right" seconds={6} delay={-1} style={{ bottom: '1%', zIndex: 20 }}><Car color="#f8fafc" w={78} /></Mover>
      <Mover dir="right" seconds={9} delay={-5} style={{ bottom: '1%', zIndex: 20 }}><Van color="#a78bfa" w={96} /></Mover>
      <Mover dir="right" seconds={12} delay={-9} style={{ bottom: '1%', zIndex: 20 }}><Car color="#facc15" w={72} /></Mover>
    </div>
  )
}

/* ---------- vehicles ---------- */
function Wheel({ cx, cy = 34, r = 7 }: { cx: number; cy?: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 2} fill="#05080f" />
      <g className="ts-wheel">
        <circle cx={cx} cy={cy} r={r - 1} fill="#cbd5e1" />
        <path d={`M${cx} ${cy - r + 2}v${(r - 2) * 2}M${cx - r + 2} ${cy}h${(r - 2) * 2}`} stroke="#475569" strokeWidth="2" />
      </g>
    </g>
  )
}

function Car({ color, w }: { color: string; w: number }) {
  return (
    <svg viewBox="0 0 110 44" width={w}>
      <path d="M6 32Q6 23 17 22L31 12H69L85 22Q104 23 104 31V35H6Z" fill={color} />
      <path d="M34 15H49V22H27ZM53 15H67L79 22H53Z" fill="#8fd3ff" />
      <rect x="98" y="26" width="6" height="4" rx="1" fill="#ffc04d" />
      <rect x="6" y="26" width="4" height="4" rx="1" fill="#ef4444" />
      <Wheel cx={28} cy={35} />
      <Wheel cx={82} cy={35} />
    </svg>
  )
}

function Van({ color, w }: { color: string; w: number }) {
  return (
    <svg viewBox="0 0 110 44" width={w}>
      <rect x="4" y="6" width="68" height="29" rx="4" fill={color} />
      <path d="M72 14H90L106 26V35H72Z" fill={color} />
      <path d="M76 17H88L98 26H76Z" fill="#8fd3ff" />
      <rect x="4" y="10" width="68" height="3" fill="#fff" opacity="0.35" />
      <rect x="100" y="27" width="6" height="4" rx="1" fill="#ffc04d" />
      <Wheel cx={26} cy={35} />
      <Wheel cx={88} cy={35} />
    </svg>
  )
}

function Bus({ color, w }: { color: string; w: number }) {
  return (
    <svg viewBox="0 0 150 44" width={w}>
      <rect x="4" y="4" width="142" height="31" rx="6" fill={color} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={14 + i * 20} y="10" width="14" height="11" rx="2" fill="#0f1b2d" opacity="0.75" />
      ))}
      <rect x="132" y="10" width="10" height="16" rx="2" fill="#8fd3ff" />
      <rect x="4" y="26" width="142" height="3" fill="#fff" opacity="0.4" />
      <Wheel cx={34} cy={35} />
      <Wheel cx={116} cy={35} />
    </svg>
  )
}

function BoxTruck({ color, w }: { color: string; w: number }) {
  return (
    <svg viewBox="0 0 130 44" width={w}>
      <rect x="4" y="4" width="84" height="31" rx="3" fill={color} />
      <rect x="4" y="14" width="84" height="4" fill="#f58a07" />
      <path d="M92 12H112L126 26V35H92Z" fill="#16263d" />
      <path d="M97 16H110L119 25H97Z" fill="#8fd3ff" />
      <rect x="120" y="27" width="6" height="4" rx="1" fill="#ffc04d" />
      <Wheel cx={24} cy={35} />
      <Wheel cx={104} cy={35} />
    </svg>
  )
}

function Pickup({ color, w }: { color: string; w: number }) {
  return (
    <svg viewBox="0 0 110 44" width={w}>
      <path d="M4 20H46V35H4Z" fill={color} />
      <path d="M46 12H72L94 22Q104 23 104 31V35H46Z" fill={color} />
      <path d="M52 15H68L82 22H52Z" fill="#8fd3ff" />
      <rect x="4" y="16" width="42" height="4" fill="#0f1b2d" opacity="0.5" />
      <rect x="98" y="26" width="6" height="4" rx="1" fill="#ffc04d" />
      <Wheel cx={24} cy={35} />
      <Wheel cx={84} cy={35} />
    </svg>
  )
}

function MainTruck() {
  return (
    <svg viewBox="0 0 300 120" className="w-full drop-shadow-xl">
      {/* trailer */}
      <rect x="4" y="14" width="190" height="72" rx="6" fill="#f58a07" />
      <rect x="4" y="14" width="190" height="10" rx="5" fill="#ffc04d" opacity="0.6" />
      <text x="99" y="62" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff" letterSpacing="2">TRUCK STOP</text>
      {/* cab */}
      <path d="M200 34h46l28 28v24h-74z" fill="#16263d" />
      <path d="M210 42h32l18 18h-50z" fill="#8fd3ff" opacity="0.85" />
      <rect x="262" y="70" width="14" height="8" rx="2" fill="#ffc04d" />
      <rect x="196" y="84" width="82" height="8" fill="#0a1424" />
      {/* wheels */}
      {[44, 84, 224, 258].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="94" r="14" fill="#0a1424" />
          <g className="ts-wheel">
            <circle cx={cx} cy="94" r="8" fill="#cbd5e1" />
            <path d={`M${cx} 87v14M${cx - 7} 94h14`} stroke="#475569" strokeWidth="2.5" />
          </g>
        </g>
      ))}
    </svg>
  )
}

/* ---------- sky ---------- */
function Cloud({ w }: { w: number }) {
  return (
    <svg viewBox="0 0 120 40" width={w} opacity="0.18">
      <ellipse cx="40" cy="26" rx="34" ry="12" fill="#fff" />
      <ellipse cx="72" cy="20" rx="30" ry="14" fill="#fff" />
      <ellipse cx="94" cy="28" rx="22" ry="9" fill="#fff" />
    </svg>
  )
}

function Plane() {
  return (
    <svg viewBox="0 0 80 30" width={56}>
      <path d="M6 14L30 12L46 2H52L46 12L70 11Q76 12 76 14Q76 16 70 17L46 16L52 26H46L30 16L6 14Z" fill="#e2e8f0" />
      <circle cx="62" cy="14" r="1.5" fill="#ef4444" />
      <rect x="-30" y="13" width="34" height="2" rx="1" fill="#fff" opacity="0.25" />
    </svg>
  )
}
