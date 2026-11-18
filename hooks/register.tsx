import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import type { Phase } from '../types'
import { HEAD, SIGNAL, TAIL, TWINKLE } from './field'
import { makeColors } from './make-colors.js'

// Near-black blue space, deep navy panels, starlight text, violet accent.
const { theme, problems } = makeColors({
  label: 'Deep Field',
  only: 'dark',
  roles: { accent: '#8B6CF0', danger: '#E5534B', success: '#4FBF8A', warning: '#E8A04A', pro: '#D45AB8' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#05070D',
        'surface-1': '#0B1020',
        'surface-2': '#0E1428',
        'surface-3': '#121A30',
        'text-primary': '#E6E9F2',
        'text-secondary': '#A3ACC4',
        'text-muted': '#8A93AD',
      },
    },
    git: { added: '#4FBF8A', removed: '#E5534B', modified: '#E8A04A' },
  },
})

// Smoked glass: light blur so the field shows faintly through the side panels.
const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'deep-field', glass: { blur: 8, tint: '#0B1020', opacity: 0.6 } },
}

const phase = atom({ plugin: 'deep-field', key: 'phase' } as const, 'idle' as Phase)

const scene = (p: Phase) => HEAD + (p === 'working' ? SIGNAL : '') + (p === 'done' ? TWINKLE : '') + TAIL

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }
    return next(e)
  })

  // A faint "signal" galaxy pulses while Claude works on the main turn.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      await update($, phase, () => 'working')
    }
    return next(e)
  })

  // A one-shot twinkle by the input box when the answer lands; its CSS fades itself out.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await update($, phase, () => 'done')
    }
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== 'deep-field') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const p = await read($, phase)
    return <Svg source={scene(p)} alt="A quiet deep field of faint, distant galaxies" isInteractive />
  })
}
