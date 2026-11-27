import { Link } from 'react-router'
import { BookIcon, PencilIcon, PinIcon, TrashIcon } from '../icons.jsx'
import { formatDate, formatFileSize, pluralize } from '../../lib/format.js'
import BookCover from './BookCover.jsx'
import StatusBadge from './StatusBadge.jsx'

export default function BookListRow({
  book,
  onEdit,
  onDelete,
  onTogglePin,
  pinPending,
}) {
  return (
    <article className="flex gap-4 px-4 py-4 transition hover:bg-stone-50/80 sm:px-5">
      <BookCover
        book={book}
        compact
        className="h-24 w-[68px] shrink-0 rounded-xl shadow-sm ring-1 ring-stone-200/80"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-sm font-semibold text-stone-950">
                {book.title}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">
                {book.author || 'Unknown author'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onTogglePin(book)}
              disabled={pinPending}
              aria-label={
                book.isPinned ? `Unpin ${book.title}` : `Pin ${book.title}`
              }
              title={book.isPinned ? 'Unpin book' : 'Pin book'}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-60 ${
                book.isPinned
                  ? 'bg-emerald-500 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              <PinIcon filled={book.isPinned} className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={book.status} />
            {book.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-600"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tag.color || '#a8a29e' }}
                />
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-400">
          {book.pageCount > 0 && (
            <span>{pluralize(book.pageCount, 'page')}</span>
          )}
          <span>{formatFileSize(book.fileSize)}</span>
          {book.lastReadAt ? (
            <span>Read {formatDate(book.lastReadAt)}</span>
          ) : (
            formatDate(book.createdAt) && (
              <span>Added {formatDate(book.createdAt)}</span>
            )
          )}

          <span className="ml-auto flex items-center gap-0.5">
            <Link
              to={`/books/${book.id}/read`}
              aria-label={`Read ${book.title}`}
              title="Read book"
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-stone-900 px-2 text-[11px] font-medium text-white transition hover:bg-stone-800"
            >
              <BookIcon className="h-3.5 w-3.5" />
              Read
            </Link>
            <button
              type="button"
              onClick={() => onEdit(book)}
              aria-label={`Edit ${book.title}`}
              title="Edit book"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(book)}
              aria-label={`Delete ${book.title}`}
              title="Delete book"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      </div>
    </article>
  )
}
