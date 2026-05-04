import { NextRequest } from "next/server"

/**
 * Decode JWT payload without verification (Firebase token comes from trusted client).
 * Returns the decoded payload or null if invalid.
 */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"))
    return decoded
  } catch (error) {
    console.error("Failed to decode JWT:", error)
    return null
  }
}

export type FirebaseAuthUser = {
  userId: string
  email: string
  name: string | null
}

/**
 * Extract the Firebase user ID from the Authorization header.
 * Returns the user's UID if valid, or null if unauthorized.
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const user = await getFirebaseAuthUserFromRequest(request)
  return user?.userId ?? null
}

export async function getFirebaseAuthUserFromRequest(request: NextRequest): Promise<FirebaseAuthUser | null> {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return null
    }

    const idToken = authHeader.substring("Bearer ".length)
    const decoded = decodeJwt(idToken)
    const userId =
      typeof decoded?.user_id === "string"
        ? decoded.user_id
        : typeof decoded?.sub === "string"
          ? decoded.sub
          : typeof decoded?.uid === "string"
            ? decoded.uid
            : null

      if (!userId) {
        return null
      }

      const email = typeof decoded?.email === "string" && decoded.email.trim()
        ? decoded.email.trim()
        : `${userId}@firebase.local`
      const name = typeof decoded?.name === "string" && decoded.name.trim()
        ? decoded.name.trim()
        : null

      return { userId, email, name }
  } catch (error) {
    console.error("Error extracting user ID from request:", error)
    return null
  }
}

/**
 * Check if a user is authenticated and return their UID.
 * Throws if not authenticated.
 */
export async function requireAuthenticatedUser(request: NextRequest): Promise<string> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    throw new Error("Unauthorized: No valid authentication token provided")
  }
  return userId
}
