import { Link } from 'react-router'
import {
  ArrowRightIcon,
  BookIcon,
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  DashboardIcon,
  FlameIcon,
  RefreshIcon,
} from '../components/icons.jsx'
import ReadingBookRow from '../components/dashboard/ReadingBookRow.jsx'
import ReadingStatsPanel from '../components/dashboard/ReadingStatsPanel.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import StatePanel from '../components/ui/StatePanel.jsx'
import { useBooks } from '../hooks/useBooks.js'
import { useReadingStats } from '../hooks/useReadingStats.js'
import { formatReadingTime, pluralize } from '../lib/format.js'
import { primaryButtonClassName, secondaryButtonClassName } from '../lib/formStyles.js'

const ACTIVITY_FILTER = { sort: 'activity' }

function DashboardSkeleton() {
  return (
    <div className="mt-8 space-y-8" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-stone-200 bg-white p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-stone-200" />
              <div className="h-8 w-8 rounded-xl bg-stone-100" />
            </div>
            <div className="mt-4 h-7 w-14 rounded bg-stone-200" />
            <div className="mt-2 h-2.5 w-20 rounded bg-stone-100" />
          </div>
        ))}
      </div>

      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <div className="h-3 w-28 rounded bg-stone-200" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((__, row) => (
              <div
                key={row}
                className="flex animate-pulse items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3"
              >
                <div className="h-16 w-12 shrink-0 rounded-lg bg-stone-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-stone-200" />
                  <div className="h-3 w-1/2 rounded bg-stone-100" />
                  <div className="h-1.5 w-full rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="h-64 animate-pulse rounded-3xl border border-stone-200 bg-white" />
    </div>
  )
}

function ReadingSection({ id, title, icon: Icon, books, variant, emptyTitle, emptyDescription }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2
          id={id}
          className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase"
        >
          <Icon className="h-3.5 w-3.5 text-emerald-600" />
          {title}
        </h2>
        {books.length > 0 && (
          <span className="text-xs text-stone-400">
            {pluralize(books.length, 'book')}
          </span>
        )}
      </div>

      {books.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {books.map((book) => (
            <ReadingBookRow key={book.id} book={book} variant={variant} />
          ))}
        </div>
      ) : (
        <StatePanel compact title={emptyTitle} description={emptyDescription} />
      )}
    </section>
  )
}

export default function DashboardPage() {
  const statsQuery = useReadingStats(7)
  const booksQuery = useBooks(ACTIVITY_FILTER)

  const stats = statsQuery.data
  const books = booksQuery.data ?? []

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
    .slice(0, 4)
  const recentBooks = books.filter((book) => book.lastReadAt).slice(0, 4)

  const isLoading = statsQuery.isLoading || booksQuery.isLoading
  const isError = statsQuery.isError || booksQuery.isError
  const errorMessage =
    statsQuery.error?.message || booksQuery.error?.message || 'Unable to load your overview.'

  function retry() {
    statsQuery.refetch()
    booksQuery.refetch()
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            Overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            A quiet look at your library and the time you spend reading.
          </p>
        </div>

        <Link to="/" className={secondaryButtonClassName}>
          <ArrowRightIcon className="h-4 w-4 rotate-180" />
          Library
        </Link>
      </header>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="mt-8">
          <StatePanel
            icon={RefreshIcon}
            tone="error"
            title="Your overview could not be loaded"
            description={errorMessage}
            action={
              <button type="button" onClick={retry} className={secondaryButtonClassName}>
                <RefreshIcon className="h-4 w-4" />
                Try again
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={BookIcon}
              label="Total books"
              value={stats.totalBooks}
              hint="In your library"
            />
            <StatCard
              icon={CheckIcon}
              label="Completed"
              value={stats.completedBooks}
              hint="Finished reads"
            />
            <StatCard
              icon={ClockIcon}
              label="Reading time"
              value={formatReadingTime(stats.readingSeconds)}
              hint="All time"
            />
            <StatCard
              icon={FlameIcon}
              label="Day streak"
              value={pluralize(stats.streakDays, 'day')}
              hint="Consecutive days"
            />
          </div>

          {stats.totalBooks === 0 ? (
            <StatePanel
              icon={BookIcon}
              title="Your reading story starts here"
              description="Add a PDF to your library and your progress, streaks, and reading time will show up here."
              action={
                <Link to="/" className={primaryButtonClassName}>
                  Go to library
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              }
            />
          ) : (
            <>
              <ReadingSection
                id="continue-heading"
                title="Continue reading"
                icon={BookmarkIcon}
                books={continueBooks}
                variant="continue"
                emptyTitle="Nothing in progress"
                emptyDescription="Open a book and we will keep your place for next time."
              />

              <ReadingSection
                id="recent-heading"
                title="Recently opened"
                icon={ClockIcon}
                books={recentBooks}
                variant="recent"
                emptyTitle="No recent books"
                emptyDescription="Books you open will appear here."
              />
            </>
          )}

          <ReadingStatsPanel
            daily={stats.daily}
            streakDays={stats.streakDays}
            todaySeconds={stats.daily.at(-1)?.seconds ?? 0}
          />

          <div className="flex items-center justify-center gap-2 pb-2 text-xs text-stone-400">
            <DashboardIcon className="h-3.5 w-3.5" />
            Your reading data stays private to your account.
          </div>
        </div>
      )}
    </div>
  )
}
