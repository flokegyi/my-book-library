import {
  BookmarkIcon,
  CloseIcon,
  RefreshIcon,
  TrashIcon,
} from '../icons.jsx'
import { useBookmarks, useDeleteBookmark } from '../../hooks/useBookmarks.js'
import { formatDate } from '../../lib/format.js'

export default function BookmarkPanel({ bookId, currentPage, onClose, onGoToPage }) {
  const bookmarksQuery = useBookmarks(bookId)
  const deleteBookmark = useDeleteBookmark(bookId)
  const bookmarks = bookmarksQuery.data ?? []

  return (
    <div
      role="dialog"
      aria-label="Bookmarks"
      className="absolute top-full right-3 z-20 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-stone-900 text-stone-100 shadow-2xl sm:right-5"
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BookmarkIcon filled className="h-4 w-4 text-emerald-400" />
            Bookmarks
          </h2>
          <p className="mt-0.5 text-[11px] text-stone-400">
            Jump back to a saved page.
          </p>
        </div>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Close bookmarks"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div
        className="max-h-72 overflow-y-auto p-2"
        aria-live="polite"
        aria-busy={bookmarksQuery.isLoading}
      >
        {bookmarksQuery.isLoading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex animate-pulse items-center gap-3 px-2 py-2">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-white/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/2 rounded bg-white/10" />
                  <div className="h-2.5 w-1/3 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : bookmarksQuery.isError ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-red-300">Bookmarks could not be loaded.</p>
            <button
              type="button"
              onClick={() => bookmarksQuery.refetch()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-200 transition hover:bg-white/10"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs font-medium text-stone-200">No bookmarks yet</p>
            <p className="mx-auto mt-1 max-w-[15rem] text-[11px] leading-5 text-stone-500">
              Save the page you are on with the bookmark button in the toolbar.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {bookmarks.map((bookmark) => {
              const isCurrent = bookmark.page === currentPage
              const isDeleting =
                deleteBookmark.isPending && deleteBookmark.variables === bookmark.id

              return (
                <li
                  key={bookmark.id}
                  className="flex items-center gap-1 rounded-xl transition hover:bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => onGoToPage(bookmark.page)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-white/5 text-stone-300'
                      }`}
                    >
                      <BookmarkIcon filled={isCurrent} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">
                        {bookmark.label || `Page ${bookmark.page}`}
                      </span>
                      <span className="block text-[10px] text-stone-500">
                        {formatDate(bookmark.createdAt) || 'Saved'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteBookmark.mutate(bookmark.id)}
                    disabled={isDeleting}
                    aria-label={`Remove bookmark on page ${bookmark.page}`}
                    title="Remove bookmark"
                    className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                  >
                    <TrashIcon className={`h-4 w-4 ${isDeleting ? 'animate-pulse' : ''}`} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-2.5 text-[11px] text-stone-500">
        {bookmarks.length > 0
          ? `${bookmarks.length} saved ${bookmarks.length === 1 ? 'page' : 'pages'}`
          : 'Bookmarks stay private to your library.'}
      </div>
    </div>
  )
}
