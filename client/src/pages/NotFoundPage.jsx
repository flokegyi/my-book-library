import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
      >
        Back to library
      </Link>
    </div>
  )
}
