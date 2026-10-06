import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Board, Phase, Push, Status } from '../types'

const PANE = 'pit-wall'
const EMPTY: Board = { repo: '', planPath: null, phases: [], pushes: [] }
const boardAtom = atom({ plugin: 'pit-wall', key: 'board' } as const, EMPTY)

const SYMBOL: Record<Status, string> = { todo: '○', doing: '◐', done: '●' }
const NEXT: Record<Status, Status> = { todo: 'doing', doing: 'done', done: 'todo' }

const storeKey = (cwd: string) => `pit-wall:${cwd}`

async function persist($: any, board: Board) {
  await update($, boardAtom, () => board)
  await $.store.set(storeKey(await $.session.cwd()), board)
}

async function change($: any, fn: (b: Board) => Board) {
  await persist($, fn(await read($, boardAtom)))
}

const sh = ($: any, script: string) => $.process.run(['sh', '-c', script])

function ago(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000))
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  if (m < 1440) return `${Math.round(m / 60)}h`
  return `${Math.round(m / 1440)}d`
}

// Phases come from "Phase N: title" headings (any level); fallback to ## headings.
// Bullets and checkboxes under a phase become its tasks.
function parsePlan(md: string, old: Phase[]): Phase[] {
  const lines = md.split('\n')
  const phaseRe = /^#{1,4}\s*(?:phase|stage|step)\s*(\d+)\s*[:.\-—–)]*\s*(.*)$/i
  let found = lines.some(l => phaseRe.test(l))
  const phases: Phase[] = []
  let cur: Phase | null = null
  for (const line of lines) {
    let title: string | null = null
    const m = line.match(phaseRe)
    if (m) title = (m[2] || `Phase ${m[1]}`).trim()
    else if (!found) {
      const h = line.match(/^##\s+(.*)$/)
      if (h) title = h[1].trim()
    }
    if (title !== null) {
      cur = { id: phases.length + 1, title: title.replace(/\*\*/g, ''), status: 'todo', tasks: [] }
      phases.push(cur)
      continue
    }
    const t = cur && line.match(/^\s*(?:[-*]|\d+\.)\s+(?:\[([ xX])\]\s+)?(.+)$/)
    if (cur && t && cur.tasks.length < 12) {
      cur.tasks.push({ text: t[2].replace(/\*\*/g, '').slice(0, 90), isDone: t[1] === 'x' || t[1] === 'X' })
    }
  }
  for (const p of phases) {
    const prev = old.find(o => o.title === p.title)
    if (prev) {
      p.status = prev.status
      p.tasks = p.tasks.map(t => ({ ...t, isDone: t.isDone || !!prev.tasks.find(o => o.text === t.text && o.isDone) }))
    }
  }
  return phases
}

async function importPlan($: any, path?: string): Promise<string> {
  let file = path?.trim()
  if (!file) {
    const r = await sh($, 'ls -t PLAN.md plan.md docs/PLAN.md docs/plan.md 2>/dev/null | head -1; ls -t "$HOME"/.claude/plans/*.md 2>/dev/null | head -1')
    file = r.stdout.split('\n').filter(Boolean)[0]
  }
  if (!file) return 'No plan found. Use /pit plan <path-to-plan.md>.'
  const r = await $.process.run(['cat', file])
  if (r.exitCode !== 0) return `Could not read ${file}.`
  const board = await read($, boardAtom)
  const phases = parsePlan(r.stdout, board.phases)
  if (phases.length === 0) return `No phases found in ${file}. Use headings like "## Phase 1: Setup".`
  await persist($, { ...board, planPath: file, phases })
  return `Loaded ${phases.length} phases from ${file}.`
}

async function refreshCi($: any) {
  const r = await sh($, 'gh run list --limit 20 --json headSha,status,conclusion 2>/dev/null')
  if (r.exitCode !== 0) return false
  let runs: { headSha: string; status: string; conclusion: string }[] = []
  try { runs = JSON.parse(r.stdout) } catch { return false }
  await change($, b => ({
    ...b,
    pushes: b.pushes.map(p => {
      const run = runs.find(x => x.headSha.startsWith(p.sha) || p.sha.startsWith(x.headSha.slice(0, 7)))
      if (!run) return p
      return { ...p, ci: run.status !== 'completed' ? 'running' : run.conclusion === 'success' ? 'pass' : 'fail' }
    }),
  }))
  return true
}

async function recordPush($: any) {
  const info = await sh($, 'git log -1 --format=%h%x1f%s; git rev-parse --abbrev-ref HEAD; git remote get-url origin 2>/dev/null')
  const [head = '', branch = '', url = ''] = info.stdout.split('\n')
  const [sha, subject = ''] = head.split('\x1f')
  if (!sha) return
  const repo = url.replace(/^.*github\.com[:/]/, '').replace(/\.git$/, '').trim()
  const board = await read($, boardAtom)
  const prev = board.pushes[0]
  const range = await sh($, prev ? `git log ${prev.sha}..HEAD --format=%s 2>/dev/null || git log -3 --format=%s` : 'git log -3 --format=%s')
  const hit = new Set<number>()
  for (const m of `${subject}\n${range.stdout}`.matchAll(/phase\s*(\d+)/gi)) hit.add(Number(m[1]))
  const push: Push = { sha, subject, branch, at: await $.clock.now(), phases: [...hit] }
  await persist($, {
    ...board,
    repo: repo || board.repo,
    pushes: [push, ...board.pushes].slice(0, 30),
    phases: board.phases.map(p => (hit.has(p.id) ? { ...p, status: 'done' as Status } : p)),
  })
  $.ui.toast(`🏁 Push logged: ${branch} ${sha}${hit.size ? ` · phase ${[...hit].join(', ')} done` : ''}`)
  void refreshCi($)
}

function setStatus(b: Board, id: number, status: Status): Board {
  return {
    ...b,
    phases: b.phases.map(p =>
      p.id === id ? { ...p, status } : status === 'doing' && p.status === 'doing' ? { ...p, status: 'todo' as Status } : p,
    ),
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const saved = (await $.store.get(storeKey(await $.session.cwd()))) as Board | undefined
    if (saved) await update($, boardAtom, () => saved)
    await $.command.register({ name: 'pit', description: 'Open the pit wall: plan phases and GitHub pushes (/pit plan|start|done|add|ci|reset)' })
    return next(e)
  })

  on('command.run', { command: 'pit' }, async ($, e) => {
    const [cmd = '', ...rest] = e.args.trim().split(/\s+/)
    const arg = rest.join(' ')
    const n = Number(rest[0])
    let text = 'Pit wall opened.'
    if (cmd === 'plan') text = await importPlan($, arg)
    else if (cmd === 'start' || cmd === 'done') {
      await change($, b => setStatus(b, n, cmd === 'start' ? 'doing' : 'done'))
      text = `Phase ${n} ${cmd === 'start' ? 'on track' : 'done'}.`
    } else if (cmd === 'add' && arg) {
      await change($, b => ({ ...b, phases: [...b.phases, { id: b.phases.length + 1, title: arg, status: 'todo', tasks: [] }] }))
      text = `Added phase: ${arg}`
    } else if (cmd === 'ci') text = (await refreshCi($)) ? 'CI status refreshed.' : 'gh not available or not logged in.'
    else if (cmd === 'reset') {
      await persist($, EMPTY)
      text = 'Pit wall cleared.'
    }
    await $.ui.open({ id: PANE, title: '🏁 Pit Wall' })
    return { text }
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (/\bgit\s+push\b/.test(e.command) && ran.deny === undefined && ran.isError !== true) {
      await recordPush($)
    }
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const board = await read($, boardAtom)
    const { phases, pushes } = board
    const done = phases.filter(p => p.status === 'done').length
    const N = 20
    const lit = phases.length ? Math.round((done / phases.length) * N) : 0
    const now = await $.clock.now()
    const current = phases.find(p => p.status === 'doing') ?? phases.find(p => p.status === 'todo')

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold color="red">🏁 PIT WALL <Text dimColor>{board.repo}</Text></Text>
          <Text dimColor>{board.planPath ? `plan: ${board.planPath}` : 'no plan loaded'}</Text>
        </Box>

        <Box flexDirection="column">
          <Text>
            <Text color="green">{'█'.repeat(Math.min(lit, 8))}</Text>
            <Text color="red">{'█'.repeat(Math.max(0, Math.min(lit, 13) - 8))}</Text>
            <Text color="magenta">{'█'.repeat(Math.max(0, lit - 13))}</Text>
            <Text dimColor>{'░'.repeat(N - lit)}</Text>
            <Text bold> {done}/{phases.length} phases</Text>
          </Text>
        </Box>

        {phases.length === 0 ? (
          <Box flexDirection="column">
            <Text dimColor>Lights out — no phases yet.</Text>
            <Button key="import" label="Import latest plan" variant="primary"
              onPress={async () => { await importPlan($) }} />
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text bold>STINTS</Text>
            {phases.map(p => (
              <Box key={`p${p.id}`} flexDirection="column">
                <Box flexDirection="row">
                  <Button key={`s${p.id}`} plain label={SYMBOL[p.status]}
                    onPress={() => change($, b => setStatus(b, p.id, NEXT[p.status]))} />
                  <Text dimColor={p.status === 'done'} bold={p === current}>
                    {' '}{p.id}. {p.title}
                  </Text>
                  {p.tasks.length > 0 && (
                    <Text dimColor> {p.tasks.filter(t => t.isDone).length}/{p.tasks.length}</Text>
                  )}
                  {p === current && p.status === 'doing' && <Text color="red" bold> ◀ ON TRACK</Text>}
                </Box>
                {p === current && p.tasks.map((t, i) => (
                  <Box key={`t${p.id}-${i}`} flexDirection="row" marginLeft={3}>
                    <Button key={`tk${p.id}-${i}`} plain label={t.isDone ? '☑' : '☐'}
                      onPress={() => change($, b => ({
                        ...b,
                        phases: b.phases.map(q => q.id === p.id
                          ? { ...q, tasks: q.tasks.map((x, j) => (j === i ? { ...x, isDone: !x.isDone } : x)) }
                          : q),
                      }))} />
                    <Text dimColor={t.isDone}> {t.text}</Text>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        )}

        <Box flexDirection="column">
          <Text bold>PUSHES</Text>
          {pushes.length === 0 && <Text dimColor>No pushes logged yet. Any `git push` run here shows up.</Text>}
          {pushes.slice(0, 8).map(p => (
            <Text key={`${p.sha}${p.at}`}>
              <Text dimColor>⬆ {ago(now - p.at).padEnd(4)}</Text>
              <Text color="cyan">{p.branch} </Text>
              <Text dimColor>{p.sha} </Text>
              <Text>{p.subject.slice(0, 48)}</Text>
              {p.phases && p.phases.length > 0 && <Text color="green"> ✓P{p.phases.join(',')}</Text>}
              {p.ci && (
                <Text color={p.ci === 'pass' ? 'green' : p.ci === 'fail' ? 'red' : 'yellow'}>
                  {' '}CI {p.ci === 'pass' ? '✔' : p.ci === 'fail' ? '✘' : '…'}
                </Text>
              )}
            </Text>
          ))}
        </Box>

        <Box flexDirection="row" gap={2}>
          <Button key="ci" label="Refresh CI" onPress={async () => { await refreshCi($) }} />
          <Button key="replan" label="Re-import plan" onPress={async () => { await importPlan($, board.planPath ?? undefined) }} />
        </Box>
      </Box>
    )
  })
}
