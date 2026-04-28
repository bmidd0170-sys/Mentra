"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const appNav = [
  { href: "/home", label: "Home" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

const notifications = [
  "Draft #2 in Biology Review improved by +8 points",
  "Organization rules were updated for Westlake Academy",
  "Reminder: You have 2 assignments pending review",
];

export default function AppHeader() {
  const pathname = usePathname();
  const inPublicFlow = pathname === "/" || pathname === "/login";

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-black tracking-tight text-slate-900">
          FeedForward
        </Link>

        {inPublicFlow ? (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              href="/home"
              className="rounded-lg bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#115e59]"
            >
              Demo app
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1 sm:gap-2">
              {appNav.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${active
                        ? "bg-[#ccfbf1] text-[#134e4a]"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <details className="group relative">
              <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                Bell (3)
              </summary>
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-black/10 bg-white p-3 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unread notifications
                </p>
                <ul className="mt-2 space-y-2">
                  {notifications.map((message) => (
                    <li
                      key={message}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700"
                    >
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
