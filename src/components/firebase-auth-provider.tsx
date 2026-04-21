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
import { getFirebaseAuth } from "@/lib/firebase"

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe = () => { }
    let cancelled = false

    const initializeAuth = async () => {
      const auth = getFirebaseAuth()

      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch {
        // Keep going even if persistence cannot be set in the current browser context.
      }

      if (cancelled) {
        return
      }

      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser)
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
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    },
    signInWithEmail: async (email, password) => {
      const auth = getFirebaseAuth()
      await signInWithEmailAndPassword(auth, email, password)
    },
    signUpWithEmail: async (email, password) => {
      const auth = getFirebaseAuth()
      await createUserWithEmailAndPassword(auth, email, password)
    },
    signOutUser: async () => {
      const auth = getFirebaseAuth()
      await signOut(auth)
    },
    deleteCurrentUser: async () => {
      const auth = getFirebaseAuth()

      if (!auth.currentUser) {
        throw new Error("No authenticated user is available.")
      }

      await deleteUser(auth.currentUser)
      setUser(null)
    },
    updateDisplayName: async (displayName) => {
      const auth = getFirebaseAuth()

      if (!auth.currentUser) {
        throw new Error("No authenticated user is available.")
      }

      await updateProfile(auth.currentUser, { displayName })
      await auth.currentUser.reload()
      setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null)
    },
    updatePhotoURL: async (photoURL) => {
      const auth = getFirebaseAuth()

      if (!auth.currentUser) {
        throw new Error("No authenticated user is available.")
      }

      await updateProfile(auth.currentUser, { photoURL })
      await auth.currentUser.reload()
      setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null)
    },
    updateEmailAddress: async (email) => {
      const auth = getFirebaseAuth()

      if (!auth.currentUser) {
        throw new Error("No authenticated user is available.")
      }

      await updateEmail(auth.currentUser, email)
      await auth.currentUser.reload()
      setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null)
    },
    sendPasswordReset: async (email) => {
      const auth = getFirebaseAuth()
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