"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/firebase-auth-provider"
import { Bell, Moon, Shield, Trash2 } from "lucide-react"

type ThemePreference = "light" | "dark" | "system"

type SettingsPreferences = {
  emailNotifications: boolean
  feedbackAlerts: boolean
  dueDateReminders: boolean
  theme: ThemePreference
  shareUsageData: boolean
  publicProfile: boolean
}

const SETTINGS_STORAGE_KEY = "mentra-settings"

const defaultSettings: SettingsPreferences = {
  emailNotifications: true,
  feedbackAlerts: true,
  dueDateReminders: true,
  theme: "system",
  shareUsageData: false,
  publicProfile: false,
}

const getInitialSettings = (): SettingsPreferences => {
  if (typeof window === "undefined") {
    return defaultSettings
  }

  try {
    const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)

    if (!rawSettings) {
      return defaultSettings
    }

    const parsed = JSON.parse(rawSettings) as Partial<SettingsPreferences>

    return {
      emailNotifications: parsed.emailNotifications ?? defaultSettings.emailNotifications,
      feedbackAlerts: parsed.feedbackAlerts ?? defaultSettings.feedbackAlerts,
      dueDateReminders: parsed.dueDateReminders ?? defaultSettings.dueDateReminders,
      theme: parsed.theme ?? defaultSettings.theme,
      shareUsageData: parsed.shareUsageData ?? defaultSettings.shareUsageData,
      publicProfile: parsed.publicProfile ?? defaultSettings.publicProfile,
    }
  } catch {
    localStorage.removeItem(SETTINGS_STORAGE_KEY)
    return defaultSettings
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading, deleteCurrentUser } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(() => getInitialSettings().emailNotifications)
  const [feedbackAlerts, setFeedbackAlerts] = useState(() => getInitialSettings().feedbackAlerts)
  const [dueDateReminders, setDueDateReminders] = useState(() => getInitialSettings().dueDateReminders)
  
  // Appearance
  const [theme, setTheme] = useState<ThemePreference>(() => getInitialSettings().theme)
  
  // Privacy
  const [shareUsageData, setShareUsageData] = useState(() => getInitialSettings().shareUsageData)
  const [publicProfile, setPublicProfile] = useState(() => getInitialSettings().publicProfile)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, router, user])

  useEffect(() => {
    const settingsToPersist: SettingsPreferences = {
      emailNotifications,
      feedbackAlerts,
      dueDateReminders,
      theme,
      shareUsageData,
      publicProfile,
    }

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToPersist))
  }, [emailNotifications, feedbackAlerts, dueDateReminders, theme, shareUsageData, publicProfile])

  useEffect(() => {
    const root = document.documentElement

    if (theme === "dark") {
      root.classList.add("dark")
      return
    }

    if (theme === "light") {
      root.classList.remove("dark")
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const applySystemTheme = (event?: MediaQueryListEvent) => {
      const prefersDark = event ? event.matches : mediaQuery.matches
      root.classList.toggle("dark", prefersDark)
    }

    applySystemTheme()
    mediaQuery.addEventListener("change", applySystemTheme)

    return () => {
      mediaQuery.removeEventListener("change", applySystemTheme)
    }
  }, [theme])

  const handleDeleteAccount = async () => {
    setMessage(null)
    setErrorMessage(null)
    setIsDeleting(true)

    try {
      await deleteCurrentUser()
      localStorage.removeItem(SETTINGS_STORAGE_KEY)
      router.replace("/login")
    } catch {
      setErrorMessage("Could not delete account. You may need to sign in again and retry.")
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading settings...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your app preferences and privacy controls</p>
      </div>

      {message ? (
        <p className="rounded-md border border-green-600/25 bg-green-600/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          {message}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configure how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important updates via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="feedback-alerts">Feedback Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when AI feedback is ready
              </p>
            </div>
            <Switch
              id="feedback-alerts"
              checked={feedbackAlerts}
              onCheckedChange={setFeedbackAlerts}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="due-reminders">Due Date Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Reminder notifications for upcoming deadlines
              </p>
            </div>
            <Switch
              id="due-reminders"
              checked={dueDateReminders}
              onCheckedChange={setDueDateReminders}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize how Mentra looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
            <Select value={theme} onValueChange={(value) => setTheme(value as ThemePreference)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Privacy</CardTitle>
          </div>
          <CardDescription>Control your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="usage-data">Share Usage Data</Label>
              <p className="text-sm text-muted-foreground">
                Help us improve by sharing anonymous usage data
              </p>
            </div>
            <Switch
              id="usage-data"
              checked={shareUsageData}
              onCheckedChange={setShareUsageData}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-profile">Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to see your profile information
              </p>
            </div>
            <Switch
              id="public-profile"
              checked={publicProfile}
              onCheckedChange={setPublicProfile}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data including organizations,
                    assignments, and feedback history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
