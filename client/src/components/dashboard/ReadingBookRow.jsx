import { Link } from 'react-router'
import { ArrowRightIcon } from '../icons.jsx'
import { formatDate } from '../../lib/format.js'
import BookCover from '../library/BookCover.jsx'

export default function ReadingBookRow({ book, variant = 'continue' }) {
  const isContinue = variant === 'continue'
  const pageCount = book.pageCount || 0
  const progress = pageCount
    ? Math.min(100, Math.round((book.lastReadPage / pageCount) * 100))
    : 0

  return (
    <Link
      to={`/books/${book.id}/read`}
      className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:border-stone-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
    >
      <BookCover
        book={book}
        compact
        className="h-16 w-12 shrink-0 rounded-lg shadow-sm ring-1 ring-stone-200/80"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-950">
          {book.title}
        </p>
        <p className="truncate text-xs text-stone-500">
          {book.author || 'Unknown author'}
        </p>

        {isContinue ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] tabular-nums text-stone-400">
              {pageCount ? `${progress}%` : `Page ${book.lastReadPage}`}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-[11px] text-stone-400">
            Opened {formatDate(book.lastReadAt)}
          </p>
        )}
      </div>

      <ArrowRightIcon className="h-4 w-4 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
    </Link>
  )
}
