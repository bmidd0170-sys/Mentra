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
import { ArrowLeft, CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles, Users, Zap } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    const errorObj = error as any
    const message = error instanceof Error ? error.message : String(error)
    
    // Log full error for debugging
    console.error("Auth error:", errorObj)
    if (errorObj?.code) console.error("Error code:", errorObj.code)
    if (errorObj?.response) console.error("Firebase response:", errorObj.response)

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
      return "Use a stronger password (at least 6 characters)."
    }

    if (message.includes("auth/user-not-found")) {
      return "No account found with that email. Try signing up."
    }

    if (message.includes("auth/wrong-password")) {
      return "Incorrect password. Please try again."
    }

    if (message.includes("auth/invalid-credential")) {
      return "Invalid email or password."
    }

    // Show raw message for debugging
    return message || "Authentication failed. Please try again."
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSignUpMode) {
      if (password.length < 6) {
        setAuthError("Use a password with at least 6 characters.")
        return
      }

      if (password !== confirmPassword) {
        setAuthError("Passwords do not match.")
        return
      }

      if (!acceptedTerms) {
        setAuthError("You need to accept the terms before creating an account.")
        return
      }
    }

    setIsLoading(true)
    setAuthError(null)
    setResetNotice(null)

    try {
      console.log(`${isSignUpMode ? "Signing up" : "Signing in"} with email: ${email}`)
      if (isSignUpMode) {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }

      console.log("Authentication successful")
      router.replace("/dashboard")
    } catch (error) {
      console.error("Auth failed:", error)
      setAuthError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
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

  const toggleAuthMode = () => {
    setIsSignUpMode((prev) => !prev)
    setAuthError(null)
    setResetNotice(null)
    setConfirmPassword("")
    setAcceptedTerms(false)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const title = isSignUpMode ? "Create your account" : "Welcome back"
  const description = isSignUpMode
    ? "Start creating polished assignments in minutes"
    : "Sign in to your Mentra account"
  const highlights = isSignUpMode
    ? [
        { icon: Sparkles, text: "Generate tailored assignments with AI" },
        { icon: Users, text: "Share work across teams and organizations" },
        { icon: ShieldCheck, text: "Secure access with Firebase authentication" },
      ]
    : [
        { icon: CheckCircle2, text: "Resume unfinished drafts instantly" },
        { icon: Users, text: "Track assignment progress by organization" },
        { icon: ShieldCheck, text: "Your data stays protected and private" },
      ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/60 bg-background/85 backdrop-blur-sm">
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
      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-6xl items-center gap-8 px-6 py-12 lg:grid-cols-[1.1fr_1fr]">
        <section className="hidden rounded-3xl border border-border/60 bg-card/60 p-8 shadow-sm backdrop-blur sm:block">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {isSignUpMode ? "New to Mentra" : "Welcome back"}
          </p>
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {isSignUpMode ? "Build classroom-ready work faster." : "Pick up exactly where you left off."}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-muted-foreground">{description}</p>

          <div className="mt-8 space-y-4">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.text} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-foreground">{item.text}</p>
                </div>
              )
            })}
          </div>
        </section>

        <Card className="w-full border-border/70 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
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
              {isSignUpMode ? "Create account with Google" : "Continue with Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or use email</span>
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
                  {!isSignUpMode && (
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground"
                      onClick={handleResetPassword}
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignUpMode ? "Create a password (min 6 characters)" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {isSignUpMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-input text-primary"
                    />
                    <span className="text-muted-foreground">
                      I agree to the Terms of Service and Privacy Policy.
                    </span>
                  </label>
                </>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? isSignUpMode
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignUpMode
                    ? "Create Account"
                    : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {isSignUpMode ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={toggleAuthMode}
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
