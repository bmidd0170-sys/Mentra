"use client"

import * as React from "react"

type LoadingOverlayProps = {
  message?: string
}

export function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white/90 p-6 shadow-md dark:bg-slate-900/90">
        <svg className="h-10 w-10 animate-spin text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{message}</p>
      </div>
    </div>
  )
}

export default LoadingOverlay
