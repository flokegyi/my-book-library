import { Link } from 'react-router'
import {
  BookIcon,
  PencilIcon,
  PinIcon,
  TrashIcon,
} from '../icons.jsx'
import { formatFileSize, pluralize } from '../../lib/format.js'
import BookCover from './BookCover.jsx'
import StatusBadge from './StatusBadge.jsx'

export default function BookCard({ book, onEdit, onDelete, onTogglePin, pinPending }) {
  const extraTags = book.tags.length - 2

  return (
    <article className="group flex min-w-0 flex-col">
      <div className="relative">
        <BookCover
          book={book}
          className="aspect-[3/4] w-full rounded-2xl shadow-sm ring-1 ring-stone-200/80"
          imageClassName="transition duration-300 group-hover:scale-[1.02]"
        />

        <Link
          to={`/books/${book.id}/read`}
          aria-label={`Read ${book.title}`}
          className="absolute inset-0 flex items-end rounded-2xl p-2 opacity-0 transition focus:opacity-100 group-hover:opacity-100"
        >
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-semibold text-stone-900 shadow-sm">
            <BookIcon className="h-3.5 w-3.5" />
            Read
          </span>
        </Link>

        <button
          type="button"
          onClick={() => onTogglePin(book)}
          disabled={pinPending}
          aria-label={book.isPinned ? `Unpin ${book.title}` : `Pin ${book.title}`}
          title={book.isPinned ? 'Unpin book' : 'Pin book'}
          className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur transition disabled:opacity-60 ${
            book.isPinned
              ? 'bg-emerald-500 text-white'
              : 'bg-white/90 text-stone-600 hover:bg-white hover:text-stone-950'
          }`}
        >
          <PinIcon
            filled={book.isPinned}
            className={`h-4 w-4 ${pinPending ? 'animate-pulse' : ''}`}
          />
        </button>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 text-sm leading-5 font-semibold text-stone-950">
          {book.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">
          {book.author || 'Unknown author'}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={book.status} />
          {book.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-600"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color || '#a8a29e' }}
              />
              <span className="truncate">{tag.name}</span>
            </span>
          ))}
          {extraTags > 0 && (
            <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-500">
              +{extraTags}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-2">
          <span className="flex min-w-0 items-center gap-1 text-[11px] text-stone-400">
            {book.pageCount ? (
              <>
                <BookIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {pluralize(book.pageCount, 'page')} ·{' '}
                  {formatFileSize(book.fileSize)}
                </span>
              </>
            ) : (
              formatFileSize(book.fileSize)
            )}
          </span>

          <span className="flex shrink-0 items-center gap-0.5">
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
