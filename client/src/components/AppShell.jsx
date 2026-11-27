import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { DashboardIcon } from './icons.jsx'
import { useAuth, useLogout } from '../hooks/useAuth.js'

function BookOpenIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 5.5A10.5 10.5 0 0 1 12 9v11a10.5 10.5 0 0 0-9.5-3.5v-11Z" />
      <path d="M21.5 5.5A10.5 10.5 0 0 0 12 9v11a10.5 10.5 0 0 1 9.5-3.5v-11Z" />
    </svg>
  )
}

function LibraryIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5V4.5A1.5 1.5 0 0 1 5.5 3H9a2 2 0 0 1 2 2v14" />
      <path d="M11 6.5A1.5 1.5 0 0 1 12.5 5H18a2 2 0 0 1 2 2v12" />
      <path d="M4 20h16" />
    </svg>
  )
}

function TagIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.6 13.6 13.6 20.6a2 2 0 0 1-2.8 0l-7.4-7.4V4h9.2l8 8a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </svg>
  )
}

function LockIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function LogoutIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
    </svg>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-950 shadow-sm">
        <BookOpenIcon />
      </span>
      <span>
        <span className="block text-sm font-semibold tracking-tight text-white">
          My Book Library
        </span>
        <span className="block text-xs text-stone-400">
          Personal PDF library
        </span>
      </span>
    </div>
  )
}

export default function AppShell() {
  const { data: user } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()

  const displayName = user?.name || 'Library Owner'
  const initial = (displayName || user?.email || '?').charAt(0).toUpperCase()

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <div className="min-h-screen bg-stone-50 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-stone-950 lg:flex lg:min-h-screen">
        <div className="px-5 py-6">
          <Brand />
        </div>

        <div className="px-3 pt-2">
          <p className="px-3 pb-2 text-[11px] font-medium tracking-[0.18em] text-stone-400 uppercase">
            Workspace
          </p>
          <nav aria-label="Main" className="space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-100'
                }`
              }
            >
              <DashboardIcon />
              Dashboard
            </NavLink>

            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-100'
                }`
              }
            >
              <LibraryIcon />
              Library
            </NavLink>

            <NavLink
              to="/tags"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-100'
                }`
              }
            >
              <TagIcon />
              Categories
            </NavLink>
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-3">
          <Link
            to="/account"
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-sm font-semibold text-stone-950">
              {initial}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium text-stone-200">
                {displayName}
              </span>
              <span className="block truncate text-[11px] text-stone-500">
                {user?.email}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-stone-400 transition hover:bg-white/5 hover:text-stone-100 disabled:opacity-50"
          >
            <LogoutIcon className="h-4 w-4" />
            {logout.isPending ? 'Signing out…' : 'Log out'}
          </button>
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-300">
            <LockIcon className="h-4 w-4 text-emerald-400" />
            Private by default
          </div>
          <p className="mt-2 text-[11px] leading-5 text-stone-400">
            Your files stay in your own storage.
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-stone-950 px-5 py-4 lg:hidden">
          <Brand />

          <div className="flex items-center gap-1">
            <Link
              to="/account"
              aria-label="Account settings"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-sm font-semibold text-stone-950"
            >
              {initial}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              aria-label="Log out"
              title="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              <LogoutIcon />
            </button>
          </div>
        </header>

        <nav
          aria-label="Mobile"
          className="flex gap-1 overflow-x-auto border-b border-white/10 bg-stone-950 px-3 py-2 lg:hidden"
        >
          {[
            { to: '/', label: 'Library', icon: BookOpenIcon, end: true },
            { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
            { to: '/tags', label: 'Categories', icon: TagIcon },
          ].map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <Outlet />
        </main>

        <footer className="mx-auto w-full max-w-5xl px-5 pb-6 text-xs text-stone-400 sm:px-8 lg:px-12">
          My Book Library
        </footer>
      </div>
    </div>
  )
}
