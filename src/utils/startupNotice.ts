import { APP_VERSION } from './appVersion'

const LAST_SEEN_VERSION_KEY = 'niwamiri_last_seen_version'
const SESSION_KEY = 'niwamiri_welcome_shown'

export type StartupStep = 'news' | 'welcome' | 'closed'

export function getStartupStep(): StartupStep {
  try {
    if (localStorage.getItem(LAST_SEEN_VERSION_KEY) !== APP_VERSION) return 'news'
    return sessionStorage.getItem(SESSION_KEY) ? 'closed' : 'welcome'
  } catch {
    // Si el navegador bloquea el almacenamiento, permitir igualmente el ingreso.
    return 'news'
  }
}

export function acknowledgeRelease() {
  try {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION)
  } catch { /* El aviso no debe impedir entrar a la colección. */ }
}

export function markWelcomeShown() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch { /* La bienvenida sigue funcionando sin persistencia de sesión. */ }
}
