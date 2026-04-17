export const DEMO_AUTH_EMAIL = "rob@launchpadphilly.org"
export const DEMO_AUTH_PASSWORD = "password123"
export const DEMO_AUTH_UID = "demo-user"
export const DEMO_AUTH_SESSION_KEY = "mentra-demo-session"

export const isDemoCredentialPair = (email: string, password: string) => {
  return email.trim().toLowerCase() === DEMO_AUTH_EMAIL && password === DEMO_AUTH_PASSWORD
}

export const getDemoSession = () => {
  if (typeof window === "undefined") {
    return false
  }

  return localStorage.getItem(DEMO_AUTH_SESSION_KEY) === "true"
}

export const setDemoSession = (enabled: boolean) => {
  if (typeof window === "undefined") {
    return
  }

  if (enabled) {
    localStorage.setItem(DEMO_AUTH_SESSION_KEY, "true")
    return
  }

  localStorage.removeItem(DEMO_AUTH_SESSION_KEY)
}
