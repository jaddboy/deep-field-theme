export type Phase = 'idle' | 'working' | 'done'

declare module 'claude-code' {
  interface PluginState {
    'deep-field': { phase: Phase }
  }
}
