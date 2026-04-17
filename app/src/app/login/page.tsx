"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/firebase-auth-provider"
import {
  DEMO_AUTH_EMAIL,
  DEMO_AUTH_PASSWORD,
  isDemoCredentialPair,
  setDemoSession,
} from "@/lib/demo-auth"
import { Zap, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [resetNotice, setResetNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard")
    }
  }, [loading, router, user])

  const getErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : ""

    if (message.includes("auth/popup-closed-by-user")) {
      return "Google sign-in was closed before it finished."
    }

    if (message.includes("auth/popup-blocked")) {
      return "Your browser blocked the Google sign-in popup."
    }

    if (message.includes("auth/email-already-in-use")) {
      return "That email is already in use. Try signing in instead."
    }

    if (message.includes("auth/invalid-email")) {
      return "Enter a valid email address."
    }

    if (message.includes("auth/weak-password")) {
      return "Use a stronger password."
    }

    if (message.includes("auth/user-not-found") || message.includes("auth/wrong-password") || message.includes("auth/invalid-credential")) {
      return "The email or password is not valid."
    }

    return message || "Something went wrong. Please try again."
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthError(null)
    setResetNotice(null)

    try {
      if (!isSignUpMode && isDemoCredentialPair(email, password)) {
        setDemoSession(true)
        router.replace("/dashboard")
        return
      }

      if (isSignUpMode) {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }

      router.replace("/dashboard")
    } catch (error) {
      setAuthError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoSignIn = () => {
    setEmail(DEMO_AUTH_EMAIL)
    setPassword(DEMO_AUTH_PASSWORD)
    setDemoSession(true)
    router.replace("/dashboard")
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setAuthError(null)
    setResetNotice(null)

    try {
      await signInWithGoogle()
      router.replace("/dashboard")
    } catch (error) {
      setAuthError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setAuthError("Enter your email address first to receive a reset link.")
      return
    }

    setIsLoading(true)
    setAuthError(null)
    setResetNotice(null)

    try {
      await sendPasswordReset(email)
      setResetNotice("Password reset email sent. Check your inbox.")
    } catch (error) {
      setAuthError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const title = isSignUpMode ? "Create your account" : "Welcome back"
  const description = isSignUpMode
    ? "Set up your Mentra account with email and password"
    : "Sign in to your Mentra account"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Mentra</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </nav>
      </header>

      {/* Login Form */}
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {authError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {authError}
              </div>
            )}

            {resetNotice && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
                {resetNotice}
              </div>
            )}

            {/* Google Login */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Email Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={handleResetPassword}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">Week 2 demo login</p>
              <p className="mt-1 text-muted-foreground">Email: {DEMO_AUTH_EMAIL}</p>
              <p className="text-muted-foreground">Password: {DEMO_AUTH_PASSWORD}</p>
              <Button type="button" variant="outline" className="mt-3 w-full" onClick={handleDemoSignIn}>
                Use Demo Credentials
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {isSignUpMode ? "Already have an account? " : "Don&apos;t have an account? "}
              <button
                type="button"
                onClick={() => setIsSignUpMode(!isSignUpMode)}
                className="font-medium text-primary hover:underline"
              >
                {isSignUpMode ? "Sign in" : "Sign up"}
              </button>
            </p>

            <div className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link href="#" className="underline hover:text-foreground">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
