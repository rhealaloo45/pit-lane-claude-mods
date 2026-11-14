// Cupertino at dusk: a ring-shaped campus seen low across a lawn of tree canopies, the hills west of the valley
// behind it, and a sky running from deep indigo through violet to a peach glow at the horizon.
// Original art in the spirit of the place: no logos, wordmarks, product imagery or brand fonts.
// Pure string building: no DOM, nothing read from outside, the same string on every call.

export const SCENE_ID = 'cupertino-dusk'

export const SCENE_ALT =
  'Dusk over a valley: a low ring-shaped building with a softly glowing window band sits among tree canopies, ' +
  'with hills behind it under an indigo sky fading to a peach horizon, stars twinkling and thin clouds drifting.'

const W = 1600
const H = 1000

/** Where the valley floor meets the hills, and the peach glow sits. */
const HORIZON = 694

/** The ring: its roof's centre, radii, wall height and the inner courtyard's radii. */
const RING = { cx: 1240, cy: 728, rx: 285, ry: 30, h: 34, irx: 185, iry: 19.5 }

/**
 * The point the campus scales about on narrower screens: the front of its base, so it stays on the lawn.
 * Under slice a box of aspect A shows the viewBox from x = 800 - 500A to 800 + 500A, so each media rule below
 * sizes and shifts the ring to fit the narrowest aspect it covers, the next rule's bound.
 */
const BASE_Y = RING.cy + RING.ry + RING.h

/** A small seeded generator, so stars and canopies land in the same places on every call. */
function random(seed: number): () => number {
  let a = seed >>> 0

  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One decimal place keeps the markup short. */
function n(value: number): string {
  return String(Math.round(value * 10) / 10)
}

/** The band between the front (lower) arcs of an ellipse at two heights: a curved wall face or window strip. */
function frontBand(cx: number, cy: number, rx: number, ry: number, top: number, bottom: number): string {
  const l = n(cx - rx)
  const r = n(cx + rx)

  return (
    `M${l} ${n(cy + top)}A${n(rx)} ${n(ry)} 0 0 0 ${r} ${n(cy + top)}` +
    `L${r} ${n(cy + bottom)}A${n(rx)} ${n(ry)} 0 0 1 ${l} ${n(cy + bottom)}Z`
  )
}

/** The band between the back (upper) arcs of an ellipse at two heights: the courtyard's far inner wall. */
function backBand(cx: number, cy: number, rx: number, ry: number, top: number, bottom: number): string {
  const l = n(cx - rx)
  const r = n(cx + rx)

  return (
    `M${l} ${n(cy + top)}A${n(rx)} ${n(ry)} 0 0 1 ${r} ${n(cy + top)}` +
    `L${r} ${n(cy + bottom)}A${n(rx)} ${n(ry)} 0 0 0 ${l} ${n(cy + bottom)}Z`
  )
}

const STYLE = `<style>
.t1{animation:tw 5.5s ease-in-out infinite}
.t2{animation:tw 8s ease-in-out infinite}
.t3{animation:tw 11s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:1}50%{opacity:.3}}
.glow{animation:glow 11s ease-in-out infinite alternate}
.halo{animation:halo 14s ease-in-out infinite alternate}
@keyframes glow{from{opacity:.74}to{opacity:1}}
@keyframes halo{from{opacity:.35}to{opacity:.75}}
.campus{transform-box:view-box;transform-origin:${RING.cx}px ${BASE_Y}px}
@media (max-aspect-ratio:3/2){.campus{transform:translateX(-100px) scale(.9)}}
@media (max-aspect-ratio:5/4){.campus{transform:translateX(-180px) scale(.78)}}
@media (max-aspect-ratio:1/1){.campus{transform:translateX(-250px) scale(.6)}}
@media (max-aspect-ratio:3/4){.campus{transform:translateX(-320px) scale(.5)}}
@media (max-aspect-ratio:9/16){.campus{transform:translateX(-335px) scale(.45)}}
@media (max-aspect-ratio:1/2){.campus{transform:translateX(-360px) scale(.38)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`

const DEFS = `<defs>
<linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${HORIZON + 6}">
<stop offset="0" stop-color="#060820"/>
<stop offset=".28" stop-color="#121646"/>
<stop offset=".5" stop-color="#26205e"/>
<stop offset=".64" stop-color="#432b72"/>
<stop offset=".74" stop-color="#743f82"/>
<stop offset=".83" stop-color="#bb687c"/>
<stop offset=".91" stop-color="#ea9273"/>
<stop offset="1" stop-color="#f9be86"/>
</linearGradient>
<radialGradient id="sun" gradientUnits="userSpaceOnUse" cx="720" cy="${HORIZON}" r="1000" gradientTransform="translate(0 ${HORIZON}) scale(1 .24) translate(0 ${-HORIZON})">
<stop offset="0" stop-color="#ffc890" stop-opacity=".85"/>
<stop offset=".45" stop-color="#f39a74" stop-opacity=".32"/>
<stop offset="1" stop-color="#f39a74" stop-opacity="0"/>
</radialGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#f4a77c" stop-opacity="0"/>
<stop offset=".8" stop-color="#f4a77c" stop-opacity=".3"/>
<stop offset="1" stop-color="#f4a77c" stop-opacity=".08"/>
</linearGradient>
<linearGradient id="lawn" gradientUnits="userSpaceOnUse" x1="0" y1="${HORIZON}" x2="0" y2="${H}">
<stop offset="0" stop-color="#2c2a4d"/>
<stop offset=".18" stop-color="#1b1e38"/>
<stop offset=".55" stop-color="#11152a"/>
<stop offset="1" stop-color="#090b19"/>
</linearGradient>
<linearGradient id="canopy" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#2c3352"/>
<stop offset=".35" stop-color="#1c2139"/>
<stop offset="1" stop-color="#11142a"/>
</linearGradient>
<linearGradient id="near" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#232945"/>
<stop offset=".5" stop-color="#10142a"/>
<stop offset="1" stop-color="#080a17"/>
</linearGradient>
<linearGradient id="wall" gradientUnits="userSpaceOnUse" x1="0" y1="${RING.cy}" x2="0" y2="${BASE_Y}">
<stop offset="0" stop-color="#2a2d4f"/>
<stop offset="1" stop-color="#15172d"/>
</linearGradient>
<linearGradient id="roof" gradientUnits="userSpaceOnUse" x1="0" y1="${RING.cy - RING.ry}" x2="0" y2="${RING.cy + RING.ry}">
<stop offset="0" stop-color="#5a5482"/>
<stop offset="1" stop-color="#363a63"/>
</linearGradient>
<linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#b79ad0"/>
<stop offset="1" stop-color="#f2b39a"/>
</linearGradient>
<radialGradient id="pool">
<stop offset="0" stop-color="#ffb36b" stop-opacity=".22"/>
<stop offset="1" stop-color="#ffb36b" stop-opacity="0"/>
</radialGradient>
<filter id="soft" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="mist" x="-10%" y="-300%" width="120%" height="700%"><feGaussianBlur stdDeviation="2.4"/></filter>
<clipPath id="court"><ellipse cx="${RING.cx}" cy="${RING.cy}" rx="${RING.irx}" ry="${RING.iry}"/></clipPath>
</defs>`

/** Stars thick near the top and thinning into the glow; a few bright ones carry a faint halo. */
function stars(): string {
  const rand = random(1984)
  const out: string[] = []

  for (let i = 0; i < 130; i++) {
    const x = rand() * W
    const y = Math.pow(rand(), 1.7) * 470
    const bright = rand() < 0.07
    const r = bright ? 1.5 + rand() * 0.7 : 0.55 + rand() * 0.85
    const fade = 1 - y / 560
    const opacity = (0.5 + rand() * 0.5) * fade
    const tone = rand() < 0.3 ? '#ffe9cf' : '#e6e9ff'
    const cls = `t${1 + Math.floor(rand() * 3)}`
    const delay = n(-rand() * 11)
    const halo = bright ? `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 3.2)}" fill-opacity=".1"/>` : ''

    out.push(
      `<g class="${cls}" fill="${tone}" style="animation-delay:${delay}s">` +
        `${halo}<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill-opacity="${Math.max(0.05, Math.round(opacity * 100) / 100)}"/></g>`,
    )
  }

  return `<g>${out.join('')}</g>`
}

interface Cloud {
  x: number
  y: number
  scale: number
  seconds: number
  opacity: number
}

/** A few thin streaks, lit pink underneath, crossing the sky over two to three minutes. */
const CLOUDS: readonly Cloud[] = [
  { x: 120, y: 585, scale: 1.1, seconds: 175, opacity: 0.32 },
  { x: 760, y: 455, scale: 0.8, seconds: 150, opacity: 0.2 },
  { x: 1180, y: 610, scale: 1, seconds: 165, opacity: 0.28 },
  { x: 380, y: 330, scale: 0.65, seconds: 180, opacity: 0.14 },
]

function clouds(): string {
  const keyframes: string[] = []
  const shapes: string[] = []

  CLOUDS.forEach((cloud, i) => {
    // From fully off the left edge to fully off the right; the delay starts each at its drawn place,
    // which is where it rests when motion is reduced.
    const from = -(cloud.x + 520)
    const to = W - cloud.x + 120
    const delay = n((-cloud.seconds * -from) / (to - from))

    keyframes.push(
      `@keyframes c${i}{0%{transform:translateX(${from}px);opacity:0}6%{opacity:1}94%{opacity:1}` +
        `100%{transform:translateX(${to}px);opacity:0}}` +
        `.c${i}{animation:c${i} ${cloud.seconds}s linear ${delay}s infinite}`,
    )
    shapes.push(
      `<g class="c${i}"><g transform="translate(${cloud.x} ${cloud.y}) scale(${cloud.scale})" fill="url(#cloud)" ` +
        `fill-opacity="${cloud.opacity}" filter="url(#mist)">` +
        `<ellipse cx="200" cy="0" rx="200" ry="5"/>` +
        `<ellipse cx="150" cy="-7" rx="110" ry="4"/>` +
        `<ellipse cx="290" cy="6" rx="150" ry="3.5"/>` +
        `<ellipse cx="90" cy="9" rx="80" ry="2.5"/>` +
        `</g></g>`,
    )
  })

  return `<style>${keyframes.join('')}</style><g>${shapes.join('')}</g>`
}

/** A ridgeline from layered sines, rising gently toward the west (left). */
function ridge(base: number, lift: number, waves: readonly (readonly [number, number, number])[]): string {
  const points: string[] = []

  for (let x = -20; x <= W + 20; x += 16) {
    let y = base - lift * (1 - x / W)

    for (const [amp, freq, phase] of waves) {
      y -= amp * (0.5 + 0.5 * Math.sin(x * freq + phase))
    }
    points.push(`${x} ${n(y)}`)
  }

  return `M-20 ${HORIZON + 30}L${points.join('L')}L${W + 20} ${HORIZON + 30}Z`
}

function hills(): string {
  const far = ridge(HORIZON - 20, 34, [
    [26, 0.0031, 0.4],
    [12, 0.0083, 2.1],
    [5, 0.021, 0.9],
  ])
  const near = ridge(HORIZON - 2, 14, [
    [16, 0.0046, 1.7],
    [7, 0.012, 0.3],
    [3, 0.03, 2.6],
  ])

  return (
    `<path d="${far}" fill="#4b3474"/>` +
    `<path d="${far}" fill="url(#haze)"/>` +
    `<path d="${near}" fill="#2f2656"/>` +
    `<path d="${near}" fill="url(#haze)" opacity=".7"/>`
  )
}

/** A canopy: four to six overlapping crowns, wider than tall, sharing one softly top-lit fill. */
function canopy(rand: () => number, x: number, y: number, size: number, fill: string): string {
  const crowns: string[] = []
  const count = 4 + Math.floor(rand() * 3)

  for (let i = 0; i < count; i++) {
    const dx = (rand() - 0.5) * size * 1.7
    const dy = (rand() - 0.6) * size * 0.4
    const r = size * (0.42 + rand() * 0.33)
    crowns.push(`<circle cx="${n(x + dx)}" cy="${n(y + dy)}" r="${n(r)}"/>`)
  }

  return `<g fill="${fill}">${crowns.join('')}</g>`
}

/** The far treeline where the valley floor meets the hills: small dark silhouettes against the glow. */
function treeline(): string {
  const rand = random(7)
  const out: string[] = []

  for (let x = -10; x < W + 10; x += 3 + rand() * 5) {
    const r = 2.5 + rand() * 4.5
    out.push(`<circle cx="${n(x)}" cy="${n(HORIZON + 3 - r * 0.3)}" r="${n(r)}"/>`)
  }

  return `<g fill="#241e47"><rect x="0" y="${HORIZON}" width="${W}" height="5"/>${out.join('')}</g>`
}

/** Canopies scattered over the lawn on the left and middle, smaller with distance. */
function lawnTrees(): string {
  const rand = random(42)
  const out: string[] = []
  const rows: readonly (readonly [number, number, number])[] = [
    // y, size, count
    [712, 8, 9],
    [736, 12, 6],
    [770, 18, 4],
  ]

  for (const [y, size, count] of rows) {
    for (let i = 0; i < count; i++) {
      const x = 30 + rand() * 860
      out.push(canopy(rand, x, y + (rand() - 0.5) * 8, size * (0.8 + rand() * 0.4), 'url(#canopy)'))
    }
  }

  return out.join('')
}

/** The ring building, its courtyard, the glowing window band and the trees in front of it. */
function campus(): string {
  const { cx, cy, rx, ry, h, irx, iry } = RING
  const rand = random(11)

  // Mullions across the front glazing, closer together toward the sides as the curve turns away.
  const mullions: string[] = []

  for (let i = 1; i < 60; i++) {
    const t = (i / 60) * Math.PI
    const x = cx + rx * Math.cos(t)
    const y = cy + ry * Math.sin(t)
    mullions.push(`M${n(x)} ${n(y + 9)}V${n(y + 25)}`)
  }

  // The courtyard: its lawn and trees, and the far inner wall with its own lit band.
  const courtTrees: string[] = []

  for (let i = 0; i < 9; i++) {
    const x = cx - irx * 0.8 + rand() * irx * 1.6
    courtTrees.push(canopy(rand, x, cy + 6 + rand() * 8, 7 + rand() * 4, '#1a2036'))
  }

  const court =
    `<g clip-path="url(#court)">` +
    `<rect x="${cx - irx}" y="${cy - iry}" width="${irx * 2}" height="${iry * 2}" fill="#141830"/>` +
    `<path d="${backBand(cx, cy, irx, iry, 0, h)}" fill="#22264a"/>` +
    `<path class="glow" d="${backBand(cx, cy, irx, iry, 10, 24)}" fill="#e8a46c" fill-opacity=".55"/>` +
    courtTrees.join('') +
    `</g>`

  // Trees in front: a loose arc before the ring, gaps left so the glow shows through.
  const front: string[] = []
  const spots: readonly (readonly [number, number, number])[] = [
    [cx - rx - 40, BASE_Y - 30, 16],
    [cx - rx + 30, BASE_Y - 10, 20],
    [cx - 150, BASE_Y + 2, 18],
    [cx - 40, BASE_Y + 4, 15],
    [cx + 90, BASE_Y + 2, 19],
    [cx + 200, BASE_Y - 6, 17],
    [cx + rx + 10, BASE_Y - 20, 21],
    [cx + rx + 75, BASE_Y - 34, 15],
  ]

  for (const [x, y, size] of spots) {
    front.push(canopy(rand, x, y, size, 'url(#canopy)'))
  }

  return (
    `<g class="campus">` +
    `<ellipse cx="${cx}" cy="${BASE_Y + 4}" rx="${rx * 1.25}" ry="${ry * 1.4}" fill="url(#pool)"/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#roof)"/>` +
    `<path d="M${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}" fill="none" stroke="#f6b884" stroke-opacity=".55" stroke-width="1.4"/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${irx + 6}" ry="${iry + 0.6}" fill="#2b2e55"/>` +
    court +
    `<path d="${frontBand(cx, cy, rx, ry, 0, h)}" fill="url(#wall)"/>` +
    `<path d="M${cx - rx} ${cy}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}" fill="none" stroke="#9a96c8" stroke-opacity=".45" stroke-width="1.2"/>` +
    `<path class="halo" d="${frontBand(cx, cy, rx, ry, 6, 28)}" fill="#ffb36b" filter="url(#soft)"/>` +
    `<path class="glow" d="${frontBand(cx, cy, rx, ry, 9, 25)}" fill="#ffd29a"/>` +
    `<path d="M${cx - rx} ${cy + 17}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + 17}" fill="none" stroke="#3a2e45" stroke-opacity=".45" stroke-width="1"/>` +
    `<path d="${mullions.join('')}" stroke="#2b2442" stroke-opacity=".55" stroke-width="1.1"/>` +
    front.join('') +
    `</g>`
  )
}

/** Large dark crowns in the near corners, framing the lawn without reaching the middle. */
function foreground(): string {
  const rand = random(99)

  return (
    canopy(rand, 1520, 965, 90, 'url(#near)') +
    canopy(rand, 1380, 1010, 70, 'url(#near)') +
    canopy(rand, 60, 990, 80, 'url(#near)')
  )
}

function build(): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    STYLE +
    DEFS +
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>` +
    `<rect width="${W}" height="${HORIZON + 40}" fill="url(#sun)"/>` +
    stars() +
    clouds() +
    hills() +
    `<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#lawn)"/>` +
    `<rect y="${HORIZON - 2}" width="${W}" height="10" fill="#f0a868" fill-opacity=".14" filter="url(#mist)"/>` +
    treeline() +
    lawnTrees() +
    campus() +
    foreground() +
    `</svg>`
  )
}

export const SCENE: string = build()
