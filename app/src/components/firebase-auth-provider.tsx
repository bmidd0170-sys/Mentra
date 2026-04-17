"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "firebase/auth"
import {
  deleteUser,
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updateProfile,
} from "firebase/auth"
import {
  DEMO_AUTH_EMAIL,
  DEMO_AUTH_UID,
  getDemoSession,
  setDemoSession,
} from "@/lib/demo-auth"
import { auth } from "@/lib/firebase"

type AuthContextValue = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  deleteCurrentUser: () => Promise<void>
  updateDisplayName: (displayName: string) => Promise<void>
  updatePhotoURL: (photoURL: string | null) => Promise<void>
  updateEmailAddress: (email: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const createDemoUser = (): User => {
  return {
    uid: DEMO_AUTH_UID,
    email: DEMO_AUTH_EMAIL,
    displayName: "Rob Launchpad",
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: null,
      lastSignInTime: null,
    },
    providerData: [],
    refreshToken: "",
    tenantId: null,
    phoneNumber: null,
    providerId: "firebase",
    delete: async () => {
      throw new Error("Demo account is read-only.")
    },
    getIdToken: async () => "",
    getIdTokenResult: async () => {
      throw new Error("Demo account does not provide Firebase tokens.")
    },
    reload: async () => {},
    toJSON: () => ({ uid: DEMO_AUTH_UID }),
  } as unknown as User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe = () => {}
    let cancelled = false

    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch {
        // Keep going even if persistence cannot be set in the current browser context.
      }

      if (cancelled) {
        return
      }

      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        if (nextUser) {
          setUser(nextUser)
        } else if (getDemoSession()) {
          setUser(createDemoUser())
        } else {
          setUser(null)
        }

        setLoading(false)
      })
    }

    void initializeAuth()

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    signInWithGoogle: async () => {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    },
    signInWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password)
    },
    signUpWithEmail: async (email, password) => {
      await createUserWithEmailAndPassword(auth, email, password)
    },
    signOutUser: async () => {
      try {
        await signOut(auth)
      } catch {
        // Sign-out failures should not keep local demo sessions active.
      }

      setDemoSession(false)
      setUser(null)
    },
    deleteCurrentUser: async () => {
      if (user?.uid === DEMO_AUTH_UID) {
        setDemoSession(false)
        setUser(null)
        return
      }

      if (!auth.currentUser) {
        throw new Error("No authenticated user is available.")
      }

      await deleteUser(auth.currentUser)
      setUser(null)
    },
    updateDisplayName: async (displayName) => {
      if (user?.uid === DEMO_AUTH_UID) {
        throw new Error("Demo account is read-only.")
      }

      if (!auth.currentUser) {
        throw new Error("No authenticated user is available.")
      }

      await updateProfile(auth.currentUser, { displayName })
      await auth.currentUser.reload()
      setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null)
    },
    updatePhotoURL: async (photoURL) => {
      if (user?.uid === DEMO_AUTH_UID) {
        throw new Error("Demo account is read-only.")
      }

      if (!auth.currentUser) {
        throw new Error("No authenticated user is available.")
      }

      await updateProfile(auth.currentUser, { photoURL })
      await auth.currentUser.reload()
      setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null)
    },
    updateEmailAddress: async (email) => {
      if (user?.uid === DEMO_AUTH_UID) {
        throw new Error("Demo account is read-only.")
      }

      if (!auth.currentUser) {
        throw new Error("No authenticated user is available.")
      }

      await updateEmail(auth.currentUser, email)
      await auth.currentUser.reload()
      setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null)
    },
    sendPasswordReset: async (email) => {
      if (user?.uid === DEMO_AUTH_UID) {
        throw new Error("Password reset is disabled for the demo account.")
      }

      await sendPasswordResetEmail(auth, email)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}