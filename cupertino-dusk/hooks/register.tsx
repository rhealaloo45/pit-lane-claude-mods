import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { SCENE, SCENE_ALT, SCENE_ID } from './scene'

// Dusk over the valley: indigo panels, sunset-amber accent. Made for dark mode alone.
const { theme, problems } = makeColors({
  label: 'Cupertino Dusk',
  only: 'dark',
  roles: { accent: '#f0a868', danger: '#e2646d', success: '#6cc08a', warning: '#e6b45c', pro: '#b29cff' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#11152a',
        'surface-1': '#171c34',
        'surface-2': '#1d233e',
        'surface-3': '#232a47',
        'text-primary': '#eef0f8',
        'text-secondary': '#c9cde0',
        'text-muted': '#a2a8c3',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE_ID, glass: { blur: 18, tint: '#0f1328', opacity: 0.5 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // The line that would stop Desktop painting this look, should a later build's makeColors raise one.
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

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    // Only the desktop and mobile apps draw a backdrop, and only this mod's scene is ours to draw.
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== SCENE_ID) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={SCENE} alt={SCENE_ALT} isInteractive />
  })
}
