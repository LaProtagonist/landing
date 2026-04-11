import {
  getStoredBackgroundSettings,
  getStoredUITheme,
  type BackgroundSphereSettings,
  type UIThemeSettings,
} from './uiTheme'

type ReleaseDraftState = {
  uiTheme: UIThemeSettings
  backgroundSphere: BackgroundSphereSettings
}

let releaseDraftState: ReleaseDraftState | null = null

function getInitialDraftState(): ReleaseDraftState {
  return {
    uiTheme: getStoredUITheme(),
    backgroundSphere: getStoredBackgroundSettings(),
  }
}

function ensureDraftState() {
  if (!releaseDraftState) {
    releaseDraftState = getInitialDraftState()
  }

  return releaseDraftState
}

export function setDraftUITheme(uiTheme: UIThemeSettings) {
  ensureDraftState().uiTheme = uiTheme
}

export function setDraftBackgroundSphere(backgroundSphere: BackgroundSphereSettings) {
  ensureDraftState().backgroundSphere = backgroundSphere
}

export function getDraftReleaseConfig() {
  const state = ensureDraftState()

  return {
    uiTheme: state.uiTheme,
    backgroundSphere: state.backgroundSphere,
  }
}
