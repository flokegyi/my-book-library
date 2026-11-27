import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth, useChangePassword } from '../hooks/useAuth.js'

const inputClassName =
  'mt-2 block w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10'

const initialForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export default function AccountPage() {
  const { data: user } = useAuth()
  const changePassword = useChangePassword()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')

  function updateField(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
      setFormError('')
      changePassword.reset()
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (form.newPassword.length < 8) {
      setFormError('New password must be at least 8 characters.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setFormError('New passwords do not match.')
      return
    }

    changePassword.mutate(
      {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      },
      {
        onSuccess: () => {
          navigate('/login?passwordChanged=1', { replace: true })
        },
      },
    )
  }

  const error =
    formError ||
    (changePassword.error instanceof Error ? changePassword.error.message : '')

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Account
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            Manage the account that protects your library.
          </p>
        </div>

        <Link
          to="/"
          className="text-sm font-medium text-stone-600 transition hover:text-stone-950"
        >
          Back to library
        </Link>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Profile</h2>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs font-medium tracking-wide text-stone-400 uppercase">
                Name
              </dt>
              <dd className="mt-1 text-sm text-stone-800">
                {user?.name || 'Library Owner'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-stone-400 uppercase">
                Email
              </dt>
              <dd className="mt-1 break-all text-sm text-stone-800">
                {user?.email}
              </dd>
            </div>
          </dl>
          <p className="mt-6 border-t border-stone-100 pt-5 text-xs leading-5 text-stone-400">
            This is a single-user library. Registration is disabled.
          </p>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">
            Change password
          </h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            Changing your password signs out every active session.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="currentPassword"
                className="text-sm font-medium text-stone-800"
              >
                Current password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                maxLength={72}
                value={form.currentPassword}
                onChange={updateField('currentPassword')}
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="text-sm font-medium text-stone-800"
              >
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={form.newPassword}
                onChange={updateField('newPassword')}
                className={inputClassName}
              />
              <p className="mt-1.5 text-xs text-stone-400">
                Use at least 8 characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-stone-800"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                className={inputClassName}
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
              disabled={changePassword.isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changePassword.isPending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {changePassword.isPending ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
