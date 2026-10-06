export type Usage = {
  contextPercent: number
  fiveHour?: number
  sevenDay?: number
  costUsd?: number
}
export type Rec = { model: 'Haiku' | 'Sonnet' | 'Opus'; id: string; why: string }

declare module 'claude-code' {
  interface PluginState {
    'usage-buddy': { usage: Usage | null; rec: Rec | null; collapsed: boolean }
  }
}
