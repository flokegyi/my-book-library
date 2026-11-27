import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useBooks, usePinBook } from '../hooks/useBooks.js'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { useTags } from '../hooks/useTags.js'
import { BOOK_STATUSES } from '../lib/bookOptions.js'
import { pluralize } from '../lib/format.js'
import {
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from '../lib/formStyles.js'
import {
  ArrowRightIcon,
  BookIcon,
  BookmarkIcon,
  CloseIcon,
  DashboardIcon,
  GridIcon,
  ListIcon,
  PinIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  TagIcon,
  UploadIcon,
} from '../components/icons.jsx'
import ReadingBookRow from '../components/dashboard/ReadingBookRow.jsx'
import BookCard from '../components/library/BookCard.jsx'
import BookListRow from '../components/library/BookListRow.jsx'
import DeleteBookDialog from '../components/library/DeleteBookDialog.jsx'
import EditBookDialog from '../components/library/EditBookDialog.jsx'
import UploadDialog from '../components/library/UploadDialog.jsx'

const SORT_OPTIONS = [
  { value: 'date', label: 'Newest first' },
  { value: 'title', label: 'Title A–Z' },
  { value: 'activity', label: 'Recently read' },
]

const VIEW_STORAGE_KEY = 'book-library:view'

function getInitialView() {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'list'
      ? 'list'
      : 'grid'
  } catch {
    return 'grid'
  }
}

function LibrarySkeleton({ view }) {
  if (view === 'list') {
    return (
      <div className="divide-y divide-stone-100 overflow-hidden rounded-3xl border border-stone-200 bg-white">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex animate-pulse gap-4 px-4 py-4 sm:px-5">
            <div className="h-24 w-[68px] shrink-0 rounded-xl bg-stone-200/80" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-2/5 rounded bg-stone-200/80" />
              <div className="h-3 w-1/4 rounded bg-stone-200/70" />
              <div className="h-3 w-1/3 rounded bg-stone-200/60" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/4] rounded-2xl bg-stone-200/80" />
          <div className="mt-3 h-3.5 w-4/5 rounded bg-stone-200/80" />
          <div className="mt-2 h-3 w-2/5 rounded bg-stone-200/60" />
          <div className="mt-3 h-3 w-1/2 rounded bg-stone-200/50" />
        </div>
      ))}
    </div>
  )
}

function BookGrid({ books, onEdit, onDelete, onTogglePin, pinPendingId }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          pinPending={pinPendingId === book.id}
        />
      ))}
    </div>
  )
}

function BookList({ books, onEdit, onDelete, onTogglePin, pinPendingId }) {
  return (
    <div className="divide-y divide-stone-100 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      {books.map((book) => (
        <BookListRow
          key={book.id}
          book={book}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          pinPending={pinPendingId === book.id}
        />
      ))}
    </div>
  )
}

function EmptyLibrary({ onUpload }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="px-6 py-16 text-center sm:py-20">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-50 text-stone-600 ring-1 ring-stone-200">
          <BookIcon className="h-6 w-6" />
        </span>

        <h2 className="mt-5 text-lg font-semibold text-stone-900">
          Your library is empty
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
          Add your first PDF. We will pull in the title, author, page count, and
          a cover from the first page.
        </p>

        <button
          type="button"
          onClick={onUpload}
          className={`${primaryButtonClassName} mt-6`}
        >
          <UploadIcon className="h-4 w-4" />
          Upload your first book
        </button>
      </div>
    </section>
  )
}

function NoResults({ onClear, hasFilters }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white px-6 py-14 text-center shadow-sm">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-50 text-stone-500 ring-1 ring-stone-200">
        <SearchIcon className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-stone-900">
        No matching books
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-stone-500">
        Try a different search or category
        {hasFilters ? ', or clear the filters to see everything.' : '.'}
      </p>
      <button
        type="button"
        onClick={onClear}
        className={`${secondaryButtonClassName} mt-5`}
      >
        Clear filters
      </button>
    </section>
  )
}

function Notice({ notice, onDismiss }) {
  if (!notice) {
    return null
  }

  const isError = notice.type === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      <p>{notice.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg opacity-60 transition hover:bg-white hover:opacity-100"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function LibraryPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [status, setStatus] = useState('')
  const [tagId, setTagId] = useState('')
  const [sort, setSort] = useState('date')
  const [view, setView] = useState(getInitialView)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [deletingBook, setDeletingBook] = useState(null)
  const [notice, setNotice] = useState(null)

  const filters = {
    q: debouncedSearch.trim(),
    status,
    tagId,
    sort,
  }
  const booksQuery = useBooks(filters)
  const tagsQuery = useTags()
  const pinBook = usePinBook()

  const books = booksQuery.data ?? []
  const tags = tagsQuery.data ?? []
  const hasFilters = Boolean(search.trim() || status || tagId)

  const continueBooks = books
    .filter(
      (book) =>
        book.status === 'READING' ||
        (book.lastReadPage > 1 && book.status !== 'COMPLETED'),
    )
    .sort(
      (first, second) =>
        new Date(second.lastReadAt ?? 0).getTime() -
        new Date(first.lastReadAt ?? 0).getTime(),
    )
    .slice(0, 3)

  useEffect(() => {
    if (tagId && tagsQuery.isSuccess && !tags.some((tag) => tag.id === tagId)) {
      setTagId('')
    }
  }, [tags, tagsQuery.isSuccess, tagId])

  function changeView(nextView) {
    setView(nextView)

    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, nextView)
    } catch {
      // Ignore storage failures; the view still changes for this session.
    }
  }

  function clearFilters() {
    setSearch('')
    setStatus('')
    setTagId('')
  }

  function handleTogglePin(book) {
    setNotice(null)

    pinBook.mutate(
      { id: book.id, pinned: !book.isPinned },
      {
        onError: (error) => {
          setNotice({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unable to pin book.',
          })
        },
      },
    )
  }

  const pinnedBooks = books.filter((book) => book.isPinned)
  const otherBooks = books.filter((book) => !book.isPinned)
  const pinPendingId = pinBook.isPending ? pinBook.variables?.id : null
  const showPinnedSection = pinnedBooks.length > 0

  const otherHeading = hasFilters
    ? 'Results'
    : showPinnedSection
      ? 'Other books'
      : 'All books'

  const errorMessage =
    booksQuery.error instanceof Error
      ? booksQuery.error.message
      : 'Unable to load your library.'

  const bookActions = {
    onEdit: setEditingBook,
    onDelete: setDeletingBook,
    onTogglePin: handleTogglePin,
    pinPendingId,
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            Collection
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Library
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            A quiet home for your PDFs, reading progress, and notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden sm:inline-flex">
            <Link to="/dashboard" className={secondaryButtonClassName}>
              <DashboardIcon className="h-4 w-4" />
              Dashboard
            </Link>
          </span>
          <Link to="/tags" className={secondaryButtonClassName}>
            <TagIcon className="h-4 w-4" />
            Categories
          </Link>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className={primaryButtonClassName}
          >
            <PlusIcon className="h-4 w-4" />
            Add a book
          </button>
        </div>
      </header>

      <div className="mt-7 space-y-4">
        <Notice notice={notice} onDismiss={() => setNotice(null)} />

        <section className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                aria-label="Search books"
                placeholder="Search by title or author…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pr-9 pl-9 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:shrink-0">
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={selectClassName}
              >
                <option value="">All statuses</option>
                {BOOK_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by category"
                value={tagId}
                onChange={(event) => setTagId(event.target.value)}
                className={selectClassName}
              >
                <option value="">All categories</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Sort books"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className={selectClassName}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-2 lg:shrink-0">
              <div
                role="group"
                aria-label="Library view"
                className="flex rounded-xl border border-stone-200 bg-stone-100 p-0.5"
              >
                <button
                  type="button"
                  onClick={() => changeView('grid')}
                  aria-pressed={view === 'grid'}
                  aria-label="Grid view"
                  title="Grid view"
                  className={`flex h-8 w-8 items-center justify-center rounded-[10px] transition ${
                    view === 'grid'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <GridIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => changeView('list')}
                  aria-pressed={view === 'list'}
                  aria-label="List view"
                  title="List view"
                  className={`flex h-8 w-8 items-center justify-center rounded-[10px] transition ${
                    view === 'list'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-stone-500 transition hover:text-stone-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </section>

        {!booksQuery.isLoading && !booksQuery.isError && (
          <div className="flex items-center justify-between px-1 text-xs text-stone-400">
            <span>
              {pluralize(books.length, 'book')}
              {showPinnedSection ? ` · ${pinnedBooks.length} pinned` : ''}
            </span>
            {booksQuery.isFetching && (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                Updating
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-4" aria-busy={booksQuery.isLoading}>
        {booksQuery.isLoading ? (
          <div role="status" aria-live="polite" aria-label="Loading books">
            <LibrarySkeleton view={view} />
          </div>
        ) : booksQuery.isError ? (
          <section className="rounded-3xl border border-red-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-base font-semibold text-stone-900">
              Your library could not be loaded
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-stone-500">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => booksQuery.refetch()}
              className={`${secondaryButtonClassName} mt-5`}
            >
              <RefreshIcon className="h-4 w-4" />
              Try again
            </button>
          </section>
        ) : books.length === 0 ? (
          hasFilters ? (
            <NoResults onClear={clearFilters} hasFilters={hasFilters} />
          ) : (
            <EmptyLibrary onUpload={() => setUploadOpen(true)} />
          )
        ) : (
          <div className="space-y-8">
            {!hasFilters && continueBooks.length > 0 && (
              <section aria-labelledby="library-continue-heading">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <h2
                    id="library-continue-heading"
                    className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase"
                  >
                    <BookmarkIcon className="h-3.5 w-3.5 text-emerald-600" />
                    Continue reading
                  </h2>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1 text-xs font-medium text-stone-500 transition hover:text-stone-900"
                  >
                    Dashboard
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {continueBooks.map((book) => (
                    <ReadingBookRow key={book.id} book={book} />
                  ))}
                </div>
              </section>
            )}

            {showPinnedSection && (
              <section aria-labelledby="pinned-heading">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <h2
                    id="pinned-heading"
                    className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase"
                  >
                    <PinIcon filled className="h-3.5 w-3.5 text-emerald-600" />
                    Pinned
                  </h2>
                  <span className="text-xs text-stone-400">
                    {pluralize(pinnedBooks.length, 'book')}
                  </span>
                </div>

                {view === 'grid' ? (
                  <BookGrid books={pinnedBooks} {...bookActions} />
                ) : (
                  <BookList books={pinnedBooks} {...bookActions} />
                )}
              </section>
            )}

            {otherBooks.length > 0 && (
              <section
                aria-labelledby={
                  showPinnedSection ? 'other-books-heading' : 'all-books-heading'
                }
              >
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <h2
                    id={
                      showPinnedSection
                        ? 'other-books-heading'
                        : 'all-books-heading'
                    }
                    className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase"
                  >
                    {otherHeading}
                  </h2>
                  <span className="text-xs text-stone-400">
                    {pluralize(otherBooks.length, 'book')}
                  </span>
                </div>

                {view === 'grid' ? (
                  <BookGrid books={otherBooks} {...bookActions} />
                ) : (
                  <BookList books={otherBooks} {...bookActions} />
                )}
              </section>
            )}
          </div>
        )}
      </div>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        tags={tags}
        onUploaded={() =>
          setNotice({ type: 'success', message: 'Book added to your library.' })
        }
      />

      <EditBookDialog
        open={Boolean(editingBook)}
        book={editingBook}
        tags={tags}
        onClose={() => setEditingBook(null)}
      />

      <DeleteBookDialog
        open={Boolean(deletingBook)}
        book={deletingBook}
        onClose={() => setDeletingBook(null)}
      />
    </div>
  )
}
