import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Rec, Usage } from '../types'

const usageAtom = atom({ plugin: 'usage-buddy', key: 'usage' } as const, null)
const recAtom = atom({ plugin: 'usage-buddy', key: 'rec' } as const, null)
const collapsedAtom = atom({ plugin: 'usage-buddy', key: 'collapsed' } as const, false)

const HARD = /\b(architect|design|refactor|migrate|migration|race condition|deadlock|security|audit|root cause|performance|optimi[sz]e|from scratch|entire|whole (repo|codebase)|trade-?offs?|plan)\b/i
const EASY = /\b(typo|rename|format|lint|comment|commit message|what does|explain this line|add (a )?log|bump|change the (color|text)|ls|list)\b/i

function recommend(text: string, pressure: number): Rec {
  const t = text.trim()
  const lines = t.split('\n').length
  let rec: Rec
  if (HARD.test(t) || t.length > 900 || lines > 25) {
    rec = { model: 'Opus', id: 'opus', why: 'big or ambiguous task: deep reasoning pays off' }
  } else if (EASY.test(t) || t.length < 90) {
    rec = { model: 'Haiku', id: 'haiku', why: 'small, quick task: cheapest model is plenty' }
  } else {
    rec = { model: 'Sonnet', id: 'sonnet', why: 'everyday coding: best speed/quality balance' }
  }
  if (pressure >= 80 && rec.model === 'Opus') {
    rec = { model: 'Sonnet', id: 'sonnet', why: `limits ${Math.round(pressure)}% used: save Opus for later` }
  } else if (pressure >= 80 && rec.model === 'Sonnet') {
    rec = { model: 'Haiku', id: 'haiku', why: `limits ${Math.round(pressure)}% used: go light` }
  }
  return rec
}


// css px per terminal cell on the desktop; tune if the card under/overshoots the band
const CELL_PX = 8
const BODY = 0xd97757
const EYE = 0x2a1810
const DEF = 0x01000000
const SPRITE = [
  '.#########.',
  '.##.###.##.',
  '.##.###.##.',
  '###########',
  '###########',
  '.#########.',
  '..#.#.#.#..',
  '..#.#.#.#..',
]

function clawd(worried: boolean): string {
  const cols = 11
  const px = SPRITE.map(r => r.split(''))
  const eyes = worried ? [2, 3] : [1, 2]
  const eyeCols = [3, 7]
  const color = (x: number, y: number) => {
    if (eyeCols.includes(x) && eyes.includes(y)) return EYE
    if (px[y][x] === '#') return BODY
    return -1
  }
  const words = new Uint32Array(cols * 4 * 3)
  for (let row = 0; row < 4; row++) {
    for (let x = 0; x < cols; x++) {
      const t = color(x, row * 2)
      const b = color(x, row * 2 + 1)
      let ch = 0x20, fg = DEF, bg = DEF
      if (t >= 0 && b >= 0) { ch = 0x2580; fg = t; bg = b }
      else if (t >= 0) { ch = 0x2580; fg = t }
      else if (b >= 0) { ch = 0x2584; fg = b }
      const i = (row * cols + x) * 3
      words[i] = ch; words[i + 1] = fg; words[i + 2] = bg
    }
  }
  return new Uint8Array(words.buffer).toBase64()
}

const bar = (p: number, w = 10) => {
  const n = Math.max(0, Math.min(w, Math.round((p / 100) * w)))
  return '█'.repeat(n) + '░'.repeat(w - n)
}
const tone = (p: number) => (p >= 80 ? 'red' : p >= 50 ? 'yellow' : 'green')

async function refresh($: any) {
  const u = await $.session.usage()
  const find = (k: string) => u.rateLimits.find((r: any) => r.kind === k)?.percentUsed
  const usage: Usage = {
    contextPercent: u.context.percent ?? 0,
    fiveHour: find('five_hour'),
    sevenDay: find('seven_day'),
    costUsd: u.cost?.usd,
  }
  await update($, usageAtom, () => usage)
}


const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const GRAD = { green: ['#7af0bd', '#2fbf86'], yellow: ['#ffe08a', '#f5a524'], red: ['#ff9a9a', '#ff4d6d'] } as const
const toneKey = (p: number) => (p >= 80 ? 'red' : p >= 50 ? 'yellow' : 'green')

const TYRE = { Haiku: ['S', '#ff3b3b'], Sonnet: ['M', '#ffd23f'], Opus: ['H', '#f2f2f2'] } as const
const LABELS = { ctx: 'FUEL', '5h': 'TYRES', '7d': 'ENGINE' } as const

function glassSvg(u: Usage, rec: Rec | null, worst: number, line: string, W: number): string {
  const H = 62
  const px = 4
  const sprite = SPRITE.map((row, y) =>
    row.split('').map((c, x) => {
      const isEye = (x === 3 || x === 7) && (worst >= 80 ? [2, 3] : [1, 2]).includes(y)
      if (isEye) return `<rect x="${x * px}" y="${y * px}" width="${px}" height="${px}" fill="#2a1810"/>`
      if (c !== '#') return ''
      const fill = y === 0 ? (x === 5 ? '#ffffff' : '#e10600') : 'url(#body)'
      return `<rect x="${x * px}" y="${y * px}" width="${px + 0.4}" height="${px + 0.4}" fill="${fill}"/>`
    }).join('')
  ).join('')

  const meters: [keyof typeof LABELS, number][] = [['ctx', u.contextPercent]]
  if (u.fiveHour !== undefined) meters.push(['5h', u.fiveHour])
  if (u.sevenDay !== undefined) meters.push(['7d', u.sevenDay])
  const cw = (W - 78 - 120) / Math.max(1, meters.length)
  const labelW = 62
  const pctW = 44
  const trackW = Math.max(60, cw - labelW - pctW - 8)
  const N = 16
  const segW = trackW / N
  const rows = meters.map(([key, p], i) => {
    const cx = 78 + i * cw
    const tx = cx + labelW
    const y = 9
    const lit = Math.round((Math.min(100, p) / 100) * N)
    const segs = Array.from({ length: N }, (_, k) => {
      const col = k < 8 ? '#2bff88' : k < 13 ? '#ff2d2d' : '#9a5cff'
      const on = k < lit
      return `<rect x="${tx + k * segW}" y="${y}" width="${segW - 2}" height="12" rx="2" fill="${on ? col : '#fff'}" fill-opacity="${on ? 1 : 0.08}"${on ? ' filter="url(#glow)"' : ''}/>`
    }).join('')
    const hot = p >= 80
    return `
    <text x="${cx}" y="${y + 10}" font-size="11" font-weight="800" font-style="italic" letter-spacing=".6" fill="#fff" fill-opacity=".72">${LABELS[key]}</text>
    ${segs}
    <text x="${tx + trackW + 6}" y="${y + 11}" font-size="13" font-weight="800" font-style="italic" fill="${hot ? '#ff5a5a' : '#fff'}">${Math.round(p)}<tspan font-size="9" fill-opacity=".7">%</tspan></text>`
  }).join('')

  const tyre = rec ? TYRE[rec.model] : null
  const recRow = rec && tyre ? `
    <circle cx="90" cy="42" r="10" fill="#141414" stroke="${tyre[1]}" stroke-width="3"/>
    <text x="90" y="46.5" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">${tyre[0]}</text>
    <text x="108" y="46" font-size="12" font-weight="800" font-style="italic" fill="#fff"><tspan fill="#ff3b3b">BOX BOX</tspan> → ${rec.model.toUpperCase()}<tspan font-weight="500" font-style="normal" fill-opacity=".7" font-size="11.5">   ${esc(rec.why)} · /model ${rec.id}</tspan></text>`
    : `<text x="78" y="46" font-size="11.5" font-style="italic" fill="#fff" fill-opacity=".55">lights out: send a prompt and the pit wall will call a tyre</text>`

  const checks = Array.from({ length: Math.ceil(W / 3) * 2 }, (_, k) => {
    const col = k >> 1
    const row = k & 1
    return (col + row) % 2 ? '' : `<rect x="${col * 3}" y="${H - 6 + row * 3}" width="3" height="3" fill="#fff"/>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="-apple-system, 'SF Pro Text', system-ui, sans-serif">
  <defs>
    <linearGradient id="pane" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4a3a" stop-opacity=".9"/><stop offset=".35" stop-color="#fff" stop-opacity=".1"/><stop offset=".7" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#ff4a3a" stop-opacity=".7"/></linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f09a78"/><stop offset="1" stop-color="#d97757"/></linearGradient>
    <linearGradient id="stripe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e10600" stop-opacity="0"/><stop offset=".15" stop-color="#e10600"/><stop offset=".85" stop-color="#e10600"/><stop offset="1" stop-color="#e10600" stop-opacity="0"/></linearGradient>
    <radialGradient id="orb1"><stop offset="0" stop-color="#e10600" stop-opacity=".55"/><stop offset="1" stop-color="#e10600" stop-opacity="0"/></radialGradient>
    <radialGradient id="orb2"><stop offset="0" stop-color="#ff7a3a" stop-opacity=".25"/><stop offset="1" stop-color="#ff7a3a" stop-opacity="0"/></radialGradient>
    <pattern id="carbon" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#0c0c0e"/><rect width="2" height="2" fill="#17171b"/><rect x="2" y="2" width="2" height="2" fill="#17171b"/></pattern>
    <filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="card"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16"/></clipPath>
  </defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#carbon)"/>
    <circle cx="38" cy="31" r="60" fill="url(#orb1)"/>
    <circle cx="${W - 60}" cy="70" r="90" fill="url(#orb2)"/>
    <rect width="${W}" height="${H}" fill="url(#pane)"/>
    <rect y="0" width="${W}" height="2.5" fill="url(#stripe)"/>
    <g opacity=".28">${checks}</g>
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="none" stroke="url(#rim)" stroke-width="1.5"/>
  <ellipse cx="38" cy="50" rx="17" ry="2.5" fill="#000" fill-opacity=".4"/>
  <g transform="translate(16 14)" shape-rendering="crispEdges">${sprite}</g>
  ${rows}${recRow}
</svg>`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const find = (k: string) => e.rateLimits.find(r => r.kind === k)?.percentUsed
    const prev = await read($, usageAtom)
    await update($, usageAtom, () => ({
      contextPercent: e.context.percent ?? 0,
      fiveHour: find('five_hour'),
      sevenDay: find('seven_day'),
      costUsd: prev?.costUsd,
    }))
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const u = await read($, usageAtom)
    const pressure = Math.max(u?.fiveHour ?? 0, u?.sevenDay ?? 0, u?.contextPercent ?? 0)
    const rec = recommend(e.text, pressure)
    await update($, recAtom, () => rec)
    $.ui.status(`✦ try ${rec.model}: ${rec.why}`)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const u = await read($, usageAtom)
    if (e.props.hasSurvey || !u) return next(e)
    const rec = await read($, recAtom)
    const t = $.ui.resolve(e) as any
    const { Box, Text, Button } = t

    if (await read($, collapsedAtom)) {
      const bits = [`FUEL ${Math.round(u.contextPercent)}%`]
      if (u.fiveHour !== undefined) bits.push(`TYRES ${Math.round(u.fiveHour)}%`)
      if (u.sevenDay !== undefined) bits.push(`ENGINE ${Math.round(u.sevenDay)}%`)
      if (rec) bits.push(`BOX → ${rec.model}`)
      return (
        <Box flexDirection="row">
          <Button key="expand" variant="secondary" label="▸ Show usage" onPress={() => update($, collapsedAtom, () => false)} />
          <Text color="#e10600">  🏁 </Text>
          <Text dimColor>{bits.join(' · ')}</Text>
        </Box>
      )
    }
    const collapse = (
      <Button key="collapse" variant="secondary" label="▾ Hide" onPress={() => update($, collapsedAtom, () => true)} />
    )

    const worst = Math.max(u.fiveHour ?? 0, u.sevenDay ?? 0, u.contextPercent)
    const line = worst >= 80 ? 'whoa, easy!' : worst >= 50 ? 'pacing myself' : 'plenty left!'

    if (e.surface !== 'terminal') {
      const { Svg } = t
      const width = Math.max(480, Math.min(1400, Math.floor(e.props.bodyColumns * CELL_PX) - 8))
      return (
        <Box position="relative">
        <Svg
          source={glassSvg(u, rec, worst, line, width)}
          alt={`Usage: context ${Math.round(u.contextPercent)}%, 5h ${u.fiveHour ?? '-'}%, 7d ${u.sevenDay ?? '-'}%. ${rec ? 'Suggested model: ' + rec.model : ''}`}
          width={width}
        />
          <Box position="absolute" top={1} right={2}>{collapse}</Box>
        </Box>
      )
    }

    const { Raster } = t
    const meter = (label: string, p?: number) =>
      p === undefined ? null : (
        <Text key={label}>
          <Text dimColor>{label} </Text>
          <Text color={tone(p)}>{bar(p)} {Math.round(p)}%</Text>
          <Text dimColor>  </Text>
        </Text>
      )

    return (
      <Box flexDirection="row">
        <Box flexDirection="column" marginRight={2}>
          <Raster key="mascot" columns={11} rows={4} cells={clawd(worst >= 80)} />
          <Text dimColor>{line}</Text>
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          <Text>
            {meter('FUEL', u.contextPercent)}
            {meter('TYRES', u.fiveHour)}
            {meter('ENGINE', u.sevenDay)}
          </Text>
          {rec ? (
            <Text>
              <Text color="red" bold>BOX BOX → </Text>
              <Text bold>{rec.model}</Text>
              <Text dimColor> ({rec.why}) /model {rec.id}</Text>
            </Text>
          ) : (
            <Text dimColor>lights out: send a prompt and the pit wall will call a tyre</Text>
          )}
        </Box>
        {collapse}
      </Box>
    )
  })
}
