"use client"

import { ChangeEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/firebase-auth-provider"
import { mockNotifications, type Notification } from "@/lib/mock-data"
import { Bell, Camera, KeyRound, Trash2, User } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const {
    user,
    loading,
    updateDisplayName,
    updatePhotoURL,
    updateEmailAddress,
    sendPasswordReset,
  } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    return [...mockNotifications].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  })
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isRequestingReset, setIsRequestingReset] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, router, user])

  useEffect(() => {
    if (!user) {
      return
    }

    setName(user.displayName || user.email?.split("@")[0] || "Mentra user")
    setEmail(user.email || "")
    setPhotoURL(user.photoURL)
  }, [user])

  const initials = useMemo(() => {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "M"
    )
  }, [name])

  const allSelected = notifications.length > 0 && selectedNotificationIds.length === notifications.length

  const toggleNotificationSelection = (notificationId: string, checked: boolean) => {
    setSelectedNotificationIds((currentIds) => {
      if (checked) {
        return currentIds.includes(notificationId) ? currentIds : [...currentIds, notificationId]
      }

      return currentIds.filter((id) => id !== notificationId)
    })
  }

  const handleSelectAllNotifications = (checked: boolean) => {
    if (!checked) {
      setSelectedNotificationIds([])
      return
    }

    setSelectedNotificationIds(notifications.map((notification) => notification.id))
  }

  const handleDeleteSingleNotification = (notificationId: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId))
    setSelectedNotificationIds((currentIds) => currentIds.filter((id) => id !== notificationId))
    setMessage("Notification deleted.")
    setErrorMessage(null)
  }

  const handleDeleteSelectedNotifications = () => {
    if (selectedNotificationIds.length === 0) {
      return
    }

    setNotifications((current) =>
      current.filter((notification) => !selectedNotificationIds.includes(notification.id))
    )
    setSelectedNotificationIds([])
    setMessage("Selected notifications deleted.")
    setErrorMessage(null)
  }

  const formatNotificationDate = (value: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value))
  }

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Please use an image smaller than 2MB.")
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : null
      setPhotoURL(value)
      setErrorMessage(null)
    }

    reader.onerror = () => {
      setErrorMessage("Could not read this image. Please try another file.")
    }

    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    if (!user) {
      return
    }

    setMessage(null)
    setErrorMessage(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      setErrorMessage("Name cannot be empty.")
      return
    }

    if (!trimmedEmail) {
      setErrorMessage("Email cannot be empty.")
      return
    }

    setIsSaving(true)

    try {
      if (trimmedName !== (user.displayName || "")) {
        await updateDisplayName(trimmedName)
      }

      if ((photoURL || null) !== (user.photoURL || null)) {
        await updatePhotoURL(photoURL)
      }

      if (trimmedEmail !== (user.email || "")) {
        await updateEmailAddress(trimmedEmail)
      }

      setMessage("Profile updated successfully.")
    } catch (error) {
      const messageText = error instanceof Error ? error.message : ""

      if (messageText.toLowerCase().includes("recent") || messageText.toLowerCase().includes("credential")) {
        setErrorMessage("For security, sign out and sign in again before changing your email.")
      } else {
        setErrorMessage("Could not save your profile right now. Please try again.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordResetRequest = async () => {
    const targetEmail = email.trim()

    if (!targetEmail) {
      setErrorMessage("Please enter your email before requesting a password reset.")
      return
    }

    setMessage(null)
    setErrorMessage(null)
    setIsRequestingReset(true)

    try {
      await sendPasswordReset(targetEmail)
      setMessage("Password reset request submitted. Check your inbox for the reset link.")
    } catch {
      setErrorMessage("Could not send reset email right now. Please try again.")
    } finally {
      setIsRequestingReset(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading profile...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Manage your personal account details</p>
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
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profile Details</CardTitle>
          </div>
          <CardDescription>Update your profile picture, name, and email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoURL} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="space-y-2">
              <Input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" />
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Label htmlFor="photo-upload" className="cursor-pointer items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Upload New Profile Picture
                </Label>
              </Button>
              <p className="text-xs text-muted-foreground">
                Click the button to choose a photo. JPG, PNG, or WEBP up to 2MB.
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Password</CardTitle>
          </div>
          <CardDescription>Submit a password change request through a reset email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            We&apos;ll send a secure reset link to your account email so you can create a new password.
          </p>
          <Button variant="outline" onClick={handlePasswordResetRequest} disabled={isRequestingReset}>
            {isRequestingReset ? "Submitting request..." : "Request Password Change"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                View all notifications, select specific items, and delete what you no longer need.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleDeleteSelectedNotifications}
              disabled={selectedNotificationIds.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedNotificationIds.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              You do not have any notifications.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="w-12 px-3 py-3">
                      <Checkbox
                        aria-label="Select all notifications"
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAllNotifications(checked === true)}
                      />
                    </th>
                    <th className="px-3 py-3 font-medium text-foreground">Title</th>
                    <th className="px-3 py-3 font-medium text-foreground">Message</th>
                    <th className="px-3 py-3 font-medium text-foreground">Received</th>
                    <th className="px-3 py-3 font-medium text-foreground">Status</th>
                    <th className="w-24 px-3 py-3 font-medium text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification) => {
                    const isSelected = selectedNotificationIds.includes(notification.id)

                    return (
                      <tr key={notification.id} className="border-t border-border">
                        <td className="px-3 py-3">
                          <Checkbox
                            aria-label={`Select notification ${notification.title}`}
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              toggleNotificationSelection(notification.id, checked === true)
                            }
                          />
                        </td>
                        <td className="px-3 py-3 font-medium text-foreground">{notification.title}</td>
                        <td className="max-w-xs px-3 py-3 text-muted-foreground">{notification.message}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {formatNotificationDate(notification.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={notification.read ? "outline" : "secondary"}>
                            {notification.read ? "Read" : "Unread"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSingleNotification(notification.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
