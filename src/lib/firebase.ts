import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let authInstance: ReturnType<typeof getAuth> | null = null

function getMissingFirebaseKeys() {
  return Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key)
}

function ensureFirebaseConfig() {
  const missingKeys = getMissingFirebaseKeys()

  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase environment variables: ${missingKeys.join(", ")}`)
  }

  return firebaseConfig as Required<typeof firebaseConfig>
}

function getFirebaseAuth() {
  if (authInstance) {
    return authInstance
  }

  const config = ensureFirebaseConfig()
  const app = getApps().length ? getApp() : initializeApp(config)
  authInstance = getAuth(app)

  return authInstance
}

export { getFirebaseAuth }