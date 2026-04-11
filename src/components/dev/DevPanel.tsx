import { button, Leva, useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import { getDraftReleaseConfig, setDraftUITheme } from '../../lib/devReleaseState'
import {
  applyUIThemeToRoot,
  getStoredUITheme,
  saveLandingSettingsPatch,
  serializeReleaseConfigSnippet,
  type UIThemeSettings,
} from '../../lib/uiTheme'

async function saveReleaseConfig(releaseUITheme: UIThemeSettings) {
  const { backgroundSphere: releaseBackgroundSphere } = getDraftReleaseConfig()

  const response = await fetch('/__dev/save-release-config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      releaseUITheme,
      releaseBackgroundSphere,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to save release config')
  }
}

async function copyReleaseConfigSnippet(releaseUITheme: UIThemeSettings) {
  const { backgroundSphere } = getDraftReleaseConfig()
  const snippet = serializeReleaseConfigSnippet({
    uiTheme: releaseUITheme,
    backgroundSphere,
  })

  await navigator.clipboard.writeText(snippet)
  window.alert('Release config copied. Paste it into src/lib/landingReleaseConfig.ts')
}

async function persistThemeToReleaseConfig(releaseUITheme: UIThemeSettings, notifySuccess: boolean) {
  try {
    await saveReleaseConfig(releaseUITheme)
    if (notifySuccess) {
      window.alert('Release config saved to src/lib/landingReleaseConfig.ts')
    }
  } catch {
    await copyReleaseConfigSnippet(releaseUITheme)
  }
}

function DevThemeControlsPanel() {
  const storedTheme = useMemo(() => getStoredUITheme(), [])
  const themeRef = useRef<UIThemeSettings>(storedTheme)

  const glass = useControls('UI Theme / Glass Cards', {
    glassAlpha: { value: storedTheme.glassAlpha, min: 0.02, max: 0.35, step: 0.01 },
    glassBlur: { value: storedTheme.glassBlur, min: 4, max: 60, step: 1 },
    glassBorderAlpha: { value: storedTheme.glassBorderAlpha, min: 0.02, max: 0.65, step: 0.01 },
    glassBorderAccent: { value: storedTheme.glassBorderAccent },
    glassTintColor: { value: storedTheme.glassTintColor },
    cardRadius: { value: storedTheme.cardRadius, min: 12, max: 40, step: 1 },
    cardShadowOpacity: { value: storedTheme.cardShadowOpacity, min: 0, max: 0.45, step: 0.01 },
  })

  const buttons = useControls('UI Theme / Buttons', {
    buttonPrimaryBg: { value: storedTheme.buttonPrimaryBg },
    buttonPrimaryText: { value: storedTheme.buttonPrimaryText },
    buttonPrimaryBorder: { value: storedTheme.buttonPrimaryBorder },
    buttonPrimaryGlow: { value: storedTheme.buttonPrimaryGlow },
    buttonSecondaryBg: { value: storedTheme.buttonSecondaryBg },
    buttonSecondaryText: { value: storedTheme.buttonSecondaryText },
    buttonSecondaryBorder: { value: storedTheme.buttonSecondaryBorder },
    buttonSecondaryGlow: { value: storedTheme.buttonSecondaryGlow },
  })

  const typography = useControls('UI Theme / Typography', {
    textPrimaryColor: { value: storedTheme.textPrimaryColor },
    textSecondaryColor: { value: storedTheme.textSecondaryColor },
    textMutedColor: { value: storedTheme.textMutedColor },
    fontSizePrimary: { value: storedTheme.fontSizePrimary, min: 14, max: 22, step: 1 },
    fontSizeSecondary: { value: storedTheme.fontSizeSecondary, min: 44, max: 96, step: 2 },
    heroTitleMaxWidth: { value: storedTheme.heroTitleMaxWidth, min: 8, max: 18, step: 1 },
    sectionTitleMaxWidth: { value: storedTheme.sectionTitleMaxWidth, min: 10, max: 30, step: 1 },
    cardTitleMaxWidth: { value: storedTheme.cardTitleMaxWidth, min: 12, max: 24, step: 1 },
  })

  const layout = useControls('UI Theme / Layout', {
    heroTopOffset: { value: storedTheme.heroTopOffset, min: 0, max: 220, step: 4 },
    phoneImageScale: { value: storedTheme.phoneImageScale, min: 0.1, max: 1.2, step: 0.01 },
  })

  const fonts = useControls('UI Theme / Fonts', {
    fontDisplay: { value: storedTheme.fontDisplay, options: ['Space Grotesk', 'Manrope', 'IBM Plex Sans'] },
    fontBody: { value: storedTheme.fontBody, options: ['Inter', 'IBM Plex Sans', 'Manrope'] },
  })

  useControls('UI Theme', {
    apply: button(() => {
      const { uiTheme } = getDraftReleaseConfig()
      saveLandingSettingsPatch({ uiTheme })
      void persistThemeToReleaseConfig(uiTheme, false).catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to save release config'
        window.alert(message)
      })
    }),
    saveToReleaseConfig: button(() => {
      const { uiTheme } = getDraftReleaseConfig()
      saveLandingSettingsPatch({ uiTheme })
      void persistThemeToReleaseConfig(uiTheme, true).catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to save release config'
        window.alert(message)
      })
    }),
  })

  const theme: UIThemeSettings = {
    ...glass,
    ...buttons,
    ...typography,
    ...layout,
    fontDisplay: fonts.fontDisplay as UIThemeSettings['fontDisplay'],
    fontBody: fonts.fontBody as UIThemeSettings['fontBody'],
  }

  themeRef.current = theme
  setDraftUITheme(theme)

  useEffect(() => {
    applyUIThemeToRoot(theme)
  }, [theme])

  return <Leva collapsed={false} />
}

function DevPanel() {
  if (!import.meta.env.DEV) {
    return null
  }

  return <DevThemeControlsPanel />
}

export default DevPanel
