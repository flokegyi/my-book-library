import {
  BookmarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  ExitFullscreenIcon,
  FitWidthIcon,
  FullscreenIcon,
  KeyboardIcon,
  ListIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '../icons.jsx'

const iconButtonClassName =
  'flex h-9 w-9 items-center justify-center rounded-lg text-stone-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30'

export function FullscreenToggleButton({
  isFullscreen,
  fullscreenSupported,
  onToggle,
  variant = 'toolbar',
}) {
  const label = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
  const title = fullscreenSupported
    ? `${isFullscreen ? 'Exit' : 'Enter'} fullscreen (F)`
    : `${
        isFullscreen ? 'Exit' : 'Enter'
      } fullscreen (F) — native fullscreen unavailable`

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isFullscreen}
        aria-label={label}
        title={title}
        className="absolute z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-stone-950/60 text-stone-100 shadow-lg backdrop-blur-sm transition hover:bg-stone-950/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        style={{
          top: 'max(0.75rem, env(safe-area-inset-top))',
          right: 'max(0.75rem, env(safe-area-inset-right))',
        }}
      >
        {isFullscreen ? (
          <ExitFullscreenIcon className="h-5 w-5" />
        ) : (
          <FullscreenIcon className="h-5 w-5" />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isFullscreen}
      aria-label={label}
      title={title}
      className={`${iconButtonClassName} ${
        isFullscreen ? 'bg-emerald-500/15 text-emerald-300' : ''
      }`}
    >
      {isFullscreen ? (
        <ExitFullscreenIcon className="h-5 w-5" />
      ) : (
        <FullscreenIcon className="h-5 w-5" />
      )}
    </button>
  )
}

export default function ReaderToolbar({
  book,
  page,
  pageCount,
  pageInput,
  pageInputRef,
  onPageInputChange,
  onPageSubmit,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  zoomPercent,
  onFinish,
  onClose,
  showShortcuts,
  onToggleShortcuts,
  saving,
  saveError,
  onRetrySave,
  isBookmarked,
  bookmarkCount = 0,
  bookmarkPending,
  onToggleBookmark,
  showBookmarks,
  onToggleBookmarks,
  isFullscreen,
  fullscreenSupported,
  onToggleFullscreen,
}) {
  const progress = pageCount ? Math.round((page / pageCount) * 100) : 0
  const isFinished = book?.status === 'COMPLETED'

  return (
    <header className="shrink-0 border-b border-white/10 bg-stone-950 text-stone-100">
      <div className="flex items-center gap-3 px-3 py-3 sm:px-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close reader"
          title="Close reader (Esc)"
          className={iconButtonClassName}
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {book?.title ?? 'Reading'}
          </p>
          <p className="truncate text-[11px] text-stone-400">
            {book?.author || 'Unknown author'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleBookmark}
          disabled={bookmarkPending}
          aria-pressed={isBookmarked}
          aria-label={isBookmarked ? 'Remove bookmark from this page' : 'Bookmark this page'}
          title={`${isBookmarked ? 'Remove bookmark' : 'Bookmark this page'} (B)`}
          className={`${iconButtonClassName} disabled:opacity-50 ${
            isBookmarked ? 'text-emerald-400 hover:text-emerald-300' : ''
          }`}
        >
          <BookmarkIcon filled={isBookmarked} className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleBookmarks}
          aria-label="Show bookmarks"
          aria-expanded={showBookmarks}
          title="Bookmarks"
          className={`${iconButtonClassName} relative ${
            showBookmarks ? 'bg-white/10 text-white' : ''
          }`}
        >
          <ListIcon className="h-5 w-5" />
          {bookmarkCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-stone-950">
              {bookmarkCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleShortcuts}
          aria-label="Keyboard shortcuts"
          aria-expanded={showShortcuts}
          title="Keyboard shortcuts (?)"
          className={`${iconButtonClassName} hidden sm:flex`}
        >
          <KeyboardIcon className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onFinish}
          disabled={isFinished}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-stone-950 transition hover:bg-emerald-400 disabled:cursor-default disabled:bg-emerald-500/20 disabled:text-emerald-200/70"
        >
          <CheckIcon className="h-4 w-4" />
          <span>{isFinished ? 'Finished' : 'Finish'}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 px-3 py-2 sm:px-5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={page <= 1}
            aria-label="Previous page"
            title="Previous page (←)"
            className={iconButtonClassName}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={page >= pageCount}
            aria-label="Next page"
            title="Next page (→)"
            className={iconButtonClassName}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={onPageSubmit}
          className="flex items-center gap-1.5 text-xs text-stone-400"
        >
          <label htmlFor="reader-page" className="sr-only">
            Page number
          </label>
          <input
            ref={pageInputRef}
            id="reader-page"
            type="number"
            min={1}
            max={pageCount || 1}
            value={pageInput}
            onChange={(event) => onPageInputChange(event.target.value)}
            className="h-9 w-14 rounded-lg border border-white/10 bg-white/5 px-2 text-center text-sm text-white outline-none transition focus:border-emerald-400 focus:bg-white/10"
          />
          <span>/ {pageCount || '—'}</span>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onZoomOut}
            aria-label="Zoom out"
            title="Zoom out (-)"
            className={iconButtonClassName}
          >
            <ZoomOutIcon className="h-5 w-5" />
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-stone-300">
            {zoomPercent}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            aria-label="Zoom in"
            title="Zoom in (+)"
            className={iconButtonClassName}
          >
            <ZoomInIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onFitWidth}
            aria-label="Fit to width"
            title="Fit to width (0)"
            className={iconButtonClassName}
          >
            <FitWidthIcon className="h-5 w-5" />
          </button>
          <FullscreenToggleButton
            isFullscreen={isFullscreen}
            fullscreenSupported={fullscreenSupported}
            onToggle={onToggleFullscreen}
          />
        </div>
      </div>

      <div className="h-0.5 w-full bg-white/10">
        <div
          className="h-full bg-emerald-400 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        aria-live="polite"
        className="flex items-center justify-between px-3 pb-2 pt-1 text-[11px] text-stone-400 sm:px-5"
      >
        <div className="flex items-center gap-3">
          <span>
            Page {page} of {pageCount || '—'} · {progress}%
          </span>
        </div>
        {saveError ? (
          <span className="text-red-300">
            Progress not saved.{' '}
            <button
              type="button"
              onClick={onRetrySave}
              className="underline underline-offset-2 hover:text-red-200"
            >
              Retry
            </button>
          </span>
        ) : (
          <span>{saving ? 'Saving progress…' : 'Progress saved'}</span>
        )}
      </div>
    </header>
  )
}
