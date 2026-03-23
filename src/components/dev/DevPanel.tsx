import { button, Leva, useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import {
  applyUIThemeToRoot,
  getStoredUITheme,
  saveLandingSettingsPatch,
  type UIThemeSettings,
} from '../../lib/uiTheme'

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
      saveLandingSettingsPatch({ uiTheme: themeRef.current })
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
