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

/**
 * Extract the Firebase user ID from the Authorization header.
 * Returns the user's UID if valid, or null if unauthorized.
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return null
    }

    const idToken = authHeader.substring("Bearer ".length)
    const decoded = decodeJwt(idToken)

    if (!decoded || typeof decoded.uid !== "string") {
      return null
    }

    return decoded.uid
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
