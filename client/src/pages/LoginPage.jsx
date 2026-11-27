import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useAuth, useLogin } from '../hooks/useAuth.js'

const inputClassName =
  'mt-2 block w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { data: currentUser } = useAuth()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const passwordChanged = searchParams.get('passwordChanged') === '1'
  const from = location.state?.from
  const redirectTo = from
    ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
    : '/'

  if (currentUser) {
    return <Navigate to={redirectTo} replace />
  }

  function handleSubmit(event) {
    event.preventDefault()

    login.mutate(
      { email, password },
      {
        onSuccess: () => navigate(redirectTo, { replace: true }),
      },
    )
  }

  const error = login.error instanceof Error ? login.error.message : null

  return (
    <div className="grid min-h-screen bg-stone-50 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-stone-950 p-12 text-stone-100 lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
        />
        <div className="relative flex flex-1 flex-col">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt=""
              className="h-11 w-11 rounded-xl shadow-sm"
            />
            <div>
              <p className="text-sm font-semibold tracking-tight">
                My Book Library
              </p>
              <p className="text-xs text-stone-400">Personal PDF library</p>
            </div>
          </div>

          <div className="mt-auto pt-32">
            <p className="max-w-sm text-3xl leading-tight font-medium tracking-tight text-white">
              Your books, notes, and reading progress in one private place.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">
              Secured for a single reader. Your files never leave your own
              storage.
            </p>
          </div>
        </div>

        <div className="relative mt-16 border-t border-white/10 pt-5 text-xs text-stone-400">
          Private by default.
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img
              src="/favicon.svg"
              alt=""
              className="h-10 w-10 rounded-xl shadow-sm"
            />
            <div>
              <p className="text-sm font-semibold tracking-tight text-stone-950">
                My Book Library
              </p>
              <p className="text-xs text-stone-500">Personal PDF library</p>
            </div>
          </div>

          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            Welcome back
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
            Sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Enter the email and password for your library account.
          </p>

          {passwordChanged && (
            <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Your password has been changed. Sign in again to continue.
            </p>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-stone-800"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-stone-800"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClassName}
                placeholder="Your password"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {login.isPending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-stone-400">
            This library does not offer public registration.
          </p>
        </div>
      </main>
    </div>
  )
}
