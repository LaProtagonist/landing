export const LANDING_SETTINGS_KEY = 'spiski-landing-settings'
const LEGACY_BACKGROUND_KEY = 'spiski-background-sphere'

export const displayFontMap = {
  'Space Grotesk': '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  Manrope: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  'IBM Plex Sans': '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
} as const

export const bodyFontMap = {
  Inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
  'IBM Plex Sans': '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
  Manrope: '"Manrope", ui-sans-serif, system-ui, sans-serif',
} as const

export type DisplayFontName = keyof typeof displayFontMap
export type BodyFontName = keyof typeof bodyFontMap

export type UIThemeSettings = {
  glassAlpha: number
  glassBlur: number
  glassBorderAlpha: number
  glassBorderAccent: string
  glassTintColor: string
  cardRadius: number
  cardShadowOpacity: number
  buttonPrimaryBg: string
  buttonPrimaryText: string
  buttonPrimaryBorder: string
  buttonPrimaryGlow: string
  buttonSecondaryBg: string
  buttonSecondaryText: string
  buttonSecondaryBorder: string
  buttonSecondaryGlow: string
  textPrimaryColor: string
  textSecondaryColor: string
  textMutedColor: string
  fontDisplay: DisplayFontName
  fontBody: BodyFontName
  fontSizePrimary: number
  fontSizeSecondary: number
  heroTitleMaxWidth: number
  sectionTitleMaxWidth: number
  cardTitleMaxWidth: number
  heroTopOffset: number
}

export const defaultUITheme: UIThemeSettings = {
  glassAlpha: 0.12,
  glassBlur: 24,
  glassBorderAlpha: 0.2,
  glassBorderAccent: '#d8ecff',
  glassTintColor: '#0b1730',
  cardRadius: 24,
  cardShadowOpacity: 0.18,
  buttonPrimaryBg: '#f3f8ff',
  buttonPrimaryText: '#05111f',
  buttonPrimaryBorder: '#d7ebff',
  buttonPrimaryGlow: '#88bfff',
  buttonSecondaryBg: '#0c1930',
  buttonSecondaryText: '#eff6ff',
  buttonSecondaryBorder: '#25426d',
  buttonSecondaryGlow: '#4b7bff',
  textPrimaryColor: '#d8e2f1',
  textSecondaryColor: '#f5f9ff',
  textMutedColor: '#90a4bf',
  fontDisplay: 'Space Grotesk',
  fontBody: 'Inter',
  fontSizePrimary: 16,
  fontSizeSecondary: 64,
  heroTitleMaxWidth: 10,
  sectionTitleMaxWidth: 12,
  cardTitleMaxWidth: 16,
  heroTopOffset: 136,
}

type LandingSettings = {
  backgroundSphere?: Record<string, unknown>
  uiTheme?: Partial<UIThemeSettings>
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseHexColor(input: string) {
  const hex = input.trim().replace('#', '')
  if (![3, 6].includes(hex.length)) {
    return null
  }

  const normalized = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex

  const int = Number.parseInt(normalized, 16)
  if (Number.isNaN(int)) {
    return null
  }

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}

function toRgba(color: string, alpha: number) {
  const parsed = parseHexColor(color)
  if (!parsed) {
    return color
  }

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`
}

function mergeUITheme(input?: Partial<UIThemeSettings>): UIThemeSettings {
  if (!input) {
    return { ...defaultUITheme }
  }

  return {
    glassAlpha: clamp(Number(input.glassAlpha ?? defaultUITheme.glassAlpha), 0.02, 0.35),
    glassBlur: clamp(Number(input.glassBlur ?? defaultUITheme.glassBlur), 4, 60),
    glassBorderAlpha: clamp(Number(input.glassBorderAlpha ?? defaultUITheme.glassBorderAlpha), 0.02, 0.65),
    glassBorderAccent: String(input.glassBorderAccent ?? defaultUITheme.glassBorderAccent),
    glassTintColor: String(input.glassTintColor ?? defaultUITheme.glassTintColor),
    cardRadius: clamp(Number(input.cardRadius ?? defaultUITheme.cardRadius), 12, 40),
    cardShadowOpacity: clamp(Number(input.cardShadowOpacity ?? defaultUITheme.cardShadowOpacity), 0, 0.45),
    buttonPrimaryBg: String(input.buttonPrimaryBg ?? defaultUITheme.buttonPrimaryBg),
    buttonPrimaryText: String(input.buttonPrimaryText ?? defaultUITheme.buttonPrimaryText),
    buttonPrimaryBorder: String(input.buttonPrimaryBorder ?? defaultUITheme.buttonPrimaryBorder),
    buttonPrimaryGlow: String(input.buttonPrimaryGlow ?? defaultUITheme.buttonPrimaryGlow),
    buttonSecondaryBg: String(input.buttonSecondaryBg ?? defaultUITheme.buttonSecondaryBg),
    buttonSecondaryText: String(input.buttonSecondaryText ?? defaultUITheme.buttonSecondaryText),
    buttonSecondaryBorder: String(input.buttonSecondaryBorder ?? defaultUITheme.buttonSecondaryBorder),
    buttonSecondaryGlow: String(input.buttonSecondaryGlow ?? defaultUITheme.buttonSecondaryGlow),
    textPrimaryColor: String(input.textPrimaryColor ?? defaultUITheme.textPrimaryColor),
    textSecondaryColor: String(input.textSecondaryColor ?? defaultUITheme.textSecondaryColor),
    textMutedColor: String(input.textMutedColor ?? defaultUITheme.textMutedColor),
    fontDisplay: (input.fontDisplay as DisplayFontName) in displayFontMap
      ? (input.fontDisplay as DisplayFontName)
      : defaultUITheme.fontDisplay,
    fontBody: (input.fontBody as BodyFontName) in bodyFontMap
      ? (input.fontBody as BodyFontName)
      : defaultUITheme.fontBody,
    fontSizePrimary: clamp(Number(input.fontSizePrimary ?? defaultUITheme.fontSizePrimary), 14, 22),
    fontSizeSecondary: clamp(Number(input.fontSizeSecondary ?? defaultUITheme.fontSizeSecondary), 44, 96),
    heroTitleMaxWidth: clamp(Number(input.heroTitleMaxWidth ?? defaultUITheme.heroTitleMaxWidth), 8, 18),
    sectionTitleMaxWidth: clamp(Number(input.sectionTitleMaxWidth ?? defaultUITheme.sectionTitleMaxWidth), 10, 30),
    cardTitleMaxWidth: clamp(Number(input.cardTitleMaxWidth ?? defaultUITheme.cardTitleMaxWidth), 12, 24),
    heroTopOffset: clamp(Number(input.heroTopOffset ?? defaultUITheme.heroTopOffset), 0, 220),
  }
}

export function loadLandingSettings(): LandingSettings {
  if (typeof window === 'undefined') {
    return { uiTheme: { ...defaultUITheme } }
  }

  try {
    const raw = window.localStorage.getItem(LANDING_SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isObject(parsed)) {
        return {
          backgroundSphere: isObject(parsed.backgroundSphere) ? parsed.backgroundSphere : undefined,
          uiTheme: mergeUITheme(isObject(parsed.uiTheme) ? (parsed.uiTheme as Partial<UIThemeSettings>) : undefined),
        }
      }
    }
  } catch {
    // ignore and fall back
  }

  try {
    const legacy = window.localStorage.getItem(LEGACY_BACKGROUND_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy)
      if (isObject(parsed)) {
        return {
          backgroundSphere: parsed,
          uiTheme: { ...defaultUITheme },
        }
      }
    }
  } catch {
    // ignore legacy read errors
  }

  return {
    uiTheme: { ...defaultUITheme },
  }
}

export function getStoredUITheme() {
  return mergeUITheme(loadLandingSettings().uiTheme)
}

export function getStoredBackgroundSettings() {
  return loadLandingSettings().backgroundSphere ?? {}
}

export function saveLandingSettingsPatch(patch: LandingSettings) {
  if (typeof window === 'undefined') {
    return
  }

  const current = loadLandingSettings()
  const next: LandingSettings = {
    backgroundSphere: patch.backgroundSphere ?? current.backgroundSphere,
    uiTheme: mergeUITheme({
      ...current.uiTheme,
      ...patch.uiTheme,
    }),
  }

  window.localStorage.setItem(LANDING_SETTINGS_KEY, JSON.stringify(next))
}

export function applyUIThemeToRoot(theme: UIThemeSettings) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  root.style.setProperty('--font-display', displayFontMap[theme.fontDisplay])
  root.style.setProperty('--font-body', bodyFontMap[theme.fontBody])
  root.style.setProperty('--text-primary-color', theme.textPrimaryColor)
  root.style.setProperty('--text-secondary-color', theme.textSecondaryColor)
  root.style.setProperty('--text-muted-color', theme.textMutedColor)
  root.style.setProperty('--font-size-primary', `${theme.fontSizePrimary}px`)
  root.style.setProperty('--font-size-secondary', `${theme.fontSizeSecondary}px`)
  root.style.setProperty('--hero-title-max-width', String(theme.heroTitleMaxWidth))
  root.style.setProperty('--section-title-max-width', String(theme.sectionTitleMaxWidth))
  root.style.setProperty('--card-title-max-width', String(theme.cardTitleMaxWidth))
  root.style.setProperty('--hero-top-offset', `${theme.heroTopOffset}px`)

  root.style.setProperty('--glass-alpha', String(theme.glassAlpha))
  root.style.setProperty('--glass-blur', `${theme.glassBlur}px`)
  root.style.setProperty('--glass-radius', `${theme.cardRadius}px`)
  root.style.setProperty('--glass-surface', toRgba(theme.glassTintColor, theme.glassAlpha))
  root.style.setProperty('--glass-border', toRgba(theme.glassBorderAccent, theme.glassBorderAlpha))
  root.style.setProperty('--glass-accent-border', toRgba(theme.glassBorderAccent, Math.min(0.8, theme.glassBorderAlpha + 0.12)))
  root.style.setProperty('--glass-shadow', toRgba('#000814', theme.cardShadowOpacity))

  root.style.setProperty('--button-primary-bg', theme.buttonPrimaryBg)
  root.style.setProperty('--button-primary-text', theme.buttonPrimaryText)
  root.style.setProperty('--button-primary-border', theme.buttonPrimaryBorder)
  root.style.setProperty('--button-primary-glow', toRgba(theme.buttonPrimaryGlow, 0.28))
  root.style.setProperty('--button-secondary-bg', theme.buttonSecondaryBg)
  root.style.setProperty('--button-secondary-text', theme.buttonSecondaryText)
  root.style.setProperty('--button-secondary-border', theme.buttonSecondaryBorder)
  root.style.setProperty('--button-secondary-glow', toRgba(theme.buttonSecondaryGlow, 0.22))
}
