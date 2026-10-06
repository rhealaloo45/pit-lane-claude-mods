export type Status = 'todo' | 'doing' | 'done'
export type Task = { text: string; isDone: boolean }
export type Phase = { id: number; title: string; status: Status; tasks: Task[] }
export type Push = { sha: string; subject: string; branch: string; at: number; ci?: string; phases?: number[] }
export type Board = {
  repo: string
  planPath: string | null
  phases: Phase[]
  pushes: Push[]
}

declare module 'claude-code' {
  interface PluginState {
    'pit-wall': { board: Board }
  }
}
