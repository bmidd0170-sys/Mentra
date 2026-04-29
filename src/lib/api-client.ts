/**
 * Wrapper for fetch that automatically includes Firebase ID token in Authorization header.
 * This must be called from a client component with access to Firebase Auth.
 * Pass the user object from useAuth().
 */
export async function fetchWithAuth(
  user: { getIdToken(): Promise<string> } | null,
  url: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<Response> {
  // Skip auth for specific calls
  if (options.skipAuth) {
    delete options.skipAuth
    return fetch(url, options)
  }

  if (!user) {
    console.warn("No authenticated user provided to fetchWithAuth")
    return fetch(url, options)
  }

  try {
    const idToken = await user.getIdToken()
    const headers = new Headers(options.headers || {})
    headers.set("Authorization", `Bearer ${idToken}`)

    return fetch(url, {
      ...options,
      headers,
    })
  } catch (error) {
    console.error("Error preparing authenticated fetch:", error)
    // Fallback to regular fetch
    return fetch(url, options)
  }
}
