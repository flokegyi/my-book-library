import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import BookmarkPanel from '../components/reader/BookmarkPanel.jsx'
import PdfPage from '../components/reader/PdfPage.jsx'
import ReaderShortcuts from '../components/reader/ReaderShortcuts.jsx'
import ReaderToolbar, {
  FullscreenToggleButton,
} from '../components/reader/ReaderToolbar.jsx'
import { RefreshIcon } from '../components/icons.jsx'
import { useBook, useSaveProgress } from '../hooks/useBook.js'
import {
  useBookmarks,
  useCreateBookmark,
  useDeleteBookmark,
} from '../hooks/useBookmarks.js'
import { usePdfDocument } from '../hooks/usePdfDocument.js'
import { useReadingSession } from '../hooks/useReadingSession.js'
import { api } from '../lib/apiClient.js'

const MIN_SCALE = 0.25
const MAX_SCALE = 4

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

export default function ReaderPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const bookQuery = useBook(id)
  const book = bookQuery.data
  const { pdf, loading, error, retrying, reload } = usePdfDocument(id)
  const saveProgress = useSaveProgress()

  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [initialized, setInitialized] = useState(false)
  const [pageSize, setPageSize] = useState(null)
  const [fitScale, setFitScale] = useState(1)
  const [manualScale, setManualScale] = useState(1)
  const [fitMode, setFitMode] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false)
  const [fullscreenSupported, setFullscreenSupported] = useState(false)

  const bookmarksQuery = useBookmarks(id)
  const bookmarks = bookmarksQuery.data ?? []
  const createBookmark = useCreateBookmark(id)
  const deleteBookmark = useDeleteBookmark(id)
  const currentBookmark = bookmarks.find((bookmark) => bookmark.page === page)
  const isBookmarked = Boolean(currentBookmark)
  const bookmarkPending = createBookmark.isPending || deleteBookmark.isPending

  const readerRef = useRef(null)
  const containerRef = useRef(null)
  const pageInputRef = useRef(null)
  const saveProgressRef = useRef(saveProgress.mutate)
  saveProgressRef.current = saveProgress.mutate

  const pendingProgressRef = useRef(null)
  const progressTimerRef = useRef(null)
  const initializedRef = useRef(false)
  const latestPageRef = useRef(page)
  latestPageRef.current = page

  const pageCount = pdf?.numPages ?? 0
  const scale = fitMode ? fitScale : manualScale
  const zoomPercent = fitScale ? Math.round((scale / fitScale) * 100) : 100
  const isImmersive = isFullscreen || isFallbackFullscreen

  const { noteActivity, finishSession } = useReadingSession({
    bookId: id,
    page,
    enabled: Boolean(pdf && book),
  })

  useEffect(() => {
    window.clearTimeout(progressTimerRef.current)
    pendingProgressRef.current = null
    initializedRef.current = false
    setInitialized(false)
    setPage(1)
    setPageInput('1')
    setPageSize(null)
    setFitMode(true)
  }, [id])

  useEffect(() => {
    if (!pdf || !book || initialized) {
      return
    }

    const resumePage = clamp(book.lastReadPage || 1, 1, pdf.numPages)
    setPage(resumePage)
    setPageInput(String(resumePage))
    initializedRef.current = true
    setInitialized(true)
  }, [book, initialized, pdf])

  useEffect(() => {
    setPageInput(String(page))
  }, [page])

  const sendProgress = useCallback((payload, keepalive = false) => {
    if (keepalive) {
      api.patchKeepalive(`/books/${payload.id}/progress`, {
        page: payload.page,
        status: payload.status,
      }).catch(() => {})
      return
    }

    saveProgressRef.current(payload)
  }, [])

  const flushProgress = useCallback(
    (keepalive = false) => {
      window.clearTimeout(progressTimerRef.current)
      progressTimerRef.current = null
      const payload = pendingProgressRef.current
      pendingProgressRef.current = null

      if (payload) {
        sendProgress(payload, keepalive)
      }
    },
    [sendProgress],
  )

  const queueProgress = useCallback(
    (payload) => {
      pendingProgressRef.current = {
        ...pendingProgressRef.current,
        ...payload,
        id,
      }
      window.clearTimeout(progressTimerRef.current)
      progressTimerRef.current = window.setTimeout(() => flushProgress(), 500)
    },
    [flushProgress, id],
  )

  const bookReady = Boolean(book)

  useEffect(() => {
    if (!pdf || !bookReady || !initialized) {
      return
    }

    queueProgress({ page })
  }, [bookReady, initialized, page, pdf, queueProgress])

  useEffect(() => {
    function persistOnExit() {
      if (!initializedRef.current) {
        return
      }

      const pending = pendingProgressRef.current
      const latestPage = pending?.page ?? latestPageRef.current

      sendProgress(pending ?? { id, page: latestPage }, true)
      pendingProgressRef.current = null
      window.clearTimeout(progressTimerRef.current)
      progressTimerRef.current = null
    }

    window.addEventListener('pagehide', persistOnExit)
    return () => {
      window.removeEventListener('pagehide', persistOnExit)
      persistOnExit()
    }
  }, [id, sendProgress])

  const handlePageSize = useCallback((size) => {
    setPageSize(size)
  }, [])

  useEffect(() => {
    const container = containerRef.current

    if (!pageSize || !container) {
      return undefined
    }

    function updateFitScale() {
      const styles = window.getComputedStyle(container)
      const horizontalPadding =
        (Number.parseFloat(styles.paddingLeft) || 0) +
        (Number.parseFloat(styles.paddingRight) || 0)
      const verticalPadding =
        (Number.parseFloat(styles.paddingTop) || 0) +
        (Number.parseFloat(styles.paddingBottom) || 0)
      const availableWidth = Math.max(
        container.clientWidth - horizontalPadding,
        240,
      )
      const widthScale = availableWidth / pageSize.width
      const heightScale = isImmersive
        ? Math.max(container.clientHeight - verticalPadding, 240) /
          pageSize.height
        : Number.POSITIVE_INFINITY
      const nextScale = clamp(
        Math.min(widthScale, heightScale),
        MIN_SCALE,
        MAX_SCALE,
      )
      setFitScale(nextScale)
    }

    updateFitScale()

    const observer = new ResizeObserver(updateFitScale)
    observer.observe(container)
    return () => observer.disconnect()
  }, [isImmersive, pageSize])

  useEffect(() => {
    const reader = readerRef.current

    setFullscreenSupported(
      Boolean(document.fullscreenEnabled && reader?.requestFullscreen),
    )

    function syncFullscreen() {
      const active = document.fullscreenElement === readerRef.current
      setIsFullscreen(active)

      if (active) {
        setIsFallbackFullscreen(false)
      }
    }

    syncFullscreen()
    document.addEventListener('fullscreenchange', syncFullscreen)

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen)

      if (reader && document.fullscreenElement === reader) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    if (!isImmersive) {
      return
    }

    setShowShortcuts(false)
    setShowBookmarks(false)
  }, [isImmersive])

  const exitFullscreen = useCallback(() => {
    setIsFallbackFullscreen(false)

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  const enterFullscreen = useCallback(() => {
    setShowShortcuts(false)
    setShowBookmarks(false)

    const reader = readerRef.current

    if (document.fullscreenEnabled && reader?.requestFullscreen) {
      reader.requestFullscreen().catch(() => {
        setIsFallbackFullscreen(true)
      })
      return
    }

    setIsFallbackFullscreen(true)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement || isFallbackFullscreen) {
      exitFullscreen()
      return
    }

    enterFullscreen()
  }, [enterFullscreen, exitFullscreen, isFallbackFullscreen])

  const goToPage = useCallback(
    (value, { trackActivity = true } = {}) => {
      if (!pdf) {
        return
      }

      const parsed = Number(value)
      const target = clamp(
        Number.isFinite(parsed) ? Math.round(parsed) : 1,
        1,
        pdf.numPages,
      )

      setPage(target)
      setPageInput(String(target))

      if (trackActivity) {
        noteActivity()
      }
    },
    [noteActivity, pdf],
  )

  const handleGoToBookmark = useCallback(
    (targetPage) => {
      goToPage(targetPage)
      setShowBookmarks(false)
    },
    [goToPage],
  )

  const handleToggleBookmark = useCallback(() => {
    if (!pdf || !book || !initialized || bookmarkPending) {
      return
    }

    if (currentBookmark) {
      deleteBookmark.mutate(currentBookmark.id)
    } else {
      createBookmark.mutate({ page })
    }

    noteActivity()
  }, [
    book,
    bookmarkPending,
    createBookmark,
    currentBookmark,
    deleteBookmark,
    initialized,
    noteActivity,
    page,
    pdf,
  ])

  const zoomBy = useCallback(
    (factor) => {
      const base = fitMode ? fitScale : manualScale
      const next = clamp(base * factor, MIN_SCALE, MAX_SCALE)
      setManualScale(next)
      setFitMode(false)
      noteActivity()
    },
    [fitMode, fitScale, manualScale, noteActivity],
  )

  const fitWidth = useCallback(() => {
    setFitMode(true)
    noteActivity()
  }, [noteActivity])

  const handleClose = useCallback(() => {
    exitFullscreen()
    navigate('/')
  }, [exitFullscreen, navigate])

  const handleFinish = useCallback(() => {
    if (!pdf || !book) {
      return
    }

    finishSession({ endPage: pdf.numPages })
    queueProgress({ page: pdf.numPages, status: 'COMPLETED' })
    goToPage(pdf.numPages, { trackActivity: false })
  }, [book, finishSession, goToPage, pdf, queueProgress])

  useEffect(() => {
    function handleActivity() {
      noteActivity()
    }

    window.addEventListener('pointerdown', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity, true)
    return () => {
      window.removeEventListener('pointerdown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity, true)
    }
  }, [noteActivity])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      const target = event.target
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      const isInteractive =
        target instanceof HTMLElement &&
        Boolean(
          target.closest(
            'button, a, [role="button"], [role="radio"], select, [contenteditable="true"]',
          ),
        )

      if (isTyping) {
        if (event.key === 'Escape') {
          target.blur()

          if (isImmersive) {
            exitFullscreen()
          }
        }
        return
      }

      if (event.key === 'Escape') {
        const hadOverlay = showShortcuts || showBookmarks

        if (showShortcuts) {
          setShowShortcuts(false)
        }

        if (showBookmarks) {
          setShowBookmarks(false)
        }

        if (isImmersive) {
          exitFullscreen()
        } else if (!hadOverlay) {
          event.preventDefault()
          handleClose()
        }
        return
      }

      if (event.key === 'f' || event.key === 'F') {
        if (!event.repeat) {
          event.preventDefault()
          toggleFullscreen()
        }
        return
      }

      if (isInteractive) {
        return
      }

      if (event.shiftKey && event.key === ' ') {
        event.preventDefault()
        goToPage(page - 1)
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault()
          goToPage(page - 1)
          break
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          event.preventDefault()
          goToPage(page + 1)
          break
        case 'Home':
          event.preventDefault()
          goToPage(1)
          break
        case 'End':
          event.preventDefault()
          goToPage(pageCount)
          break
        case '+':
        case '=':
          event.preventDefault()
          zoomBy(1.2)
          break
        case '-':
        case '_':
          event.preventDefault()
          zoomBy(1 / 1.2)
          break
        case '0':
          event.preventDefault()
          fitWidth()
          break
        case '/':
          event.preventDefault()
          pageInputRef.current?.focus()
          pageInputRef.current?.select()
          break
        case 'b':
        case 'B':
          event.preventDefault()
          handleToggleBookmark()
          break
        case '?':
          event.preventDefault()
          setShowShortcuts((current) => !current)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    exitFullscreen,
    fitWidth,
    goToPage,
    handleClose,
    handleToggleBookmark,
    isImmersive,
    page,
    pageCount,
    showBookmarks,
    showShortcuts,
    toggleFullscreen,
    zoomBy,
  ])

  function handlePageSubmit(event) {
    event.preventDefault()
    goToPage(pageInput)
  }

  const isInitializing = bookQuery.isLoading || loading || (pdf && !initialized)
  const fatalError = bookQuery.error || error

  return (
    <div
      ref={readerRef}
      className={`flex min-h-0 flex-col overflow-hidden bg-stone-300 text-stone-950 ${
        isImmersive ? 'fixed inset-0 z-50 h-dvh' : 'relative h-dvh'
      }`}
    >
      {!isImmersive && (
        <div className="relative shrink-0">
          <ReaderToolbar
            book={book}
            page={page}
            pageCount={pageCount}
            pageInput={pageInput}
            pageInputRef={pageInputRef}
            onPageInputChange={setPageInput}
            onPageSubmit={handlePageSubmit}
            onPrev={() => goToPage(page - 1)}
            onNext={() => goToPage(page + 1)}
            onZoomIn={() => zoomBy(1.2)}
            onZoomOut={() => zoomBy(1 / 1.2)}
            onFitWidth={fitWidth}
            zoomPercent={zoomPercent}
            onFinish={handleFinish}
            onClose={handleClose}
            showShortcuts={showShortcuts}
            onToggleShortcuts={() => setShowShortcuts((current) => !current)}
            saving={saveProgress.isPending}
            saveError={saveProgress.isError}
            onRetrySave={() => saveProgress.mutate(saveProgress.variables)}
            isBookmarked={isBookmarked}
            bookmarkCount={bookmarks.length}
            bookmarkPending={bookmarkPending}
            onToggleBookmark={handleToggleBookmark}
            showBookmarks={showBookmarks}
            onToggleBookmarks={() => setShowBookmarks((current) => !current)}
            isFullscreen={isImmersive}
            fullscreenSupported={fullscreenSupported}
            onToggleFullscreen={toggleFullscreen}
          />

          {showBookmarks && (
            <BookmarkPanel
              bookId={id}
              currentPage={page}
              onClose={() => setShowBookmarks(false)}
              onGoToPage={handleGoToBookmark}
            />
          )}
        </div>
      )}

      <main
        ref={containerRef}
        aria-label={`${book?.title ?? 'Book'} PDF document`}
        className={`relative flex min-h-0 flex-1 items-start justify-center overflow-auto ${
          isImmersive ? 'p-0' : 'px-4 py-6 sm:px-8 sm:py-8'
        }`}
      >
        {isInitializing && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-stone-500">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-stone-400 border-t-stone-900" />
            <span>{retrying ? 'Refreshing secure link…' : 'Opening PDF…'}</span>
          </div>
        )}

        {fatalError && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="max-w-md text-sm text-red-700">
              {bookQuery.error?.message ||
                error ||
                'Unable to open this book.'}
            </p>
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              <RefreshIcon className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

        {pdf && initialized && book && !fatalError && (
          <div className={isImmersive ? 'my-auto' : undefined}>
            <PdfPage
              pdf={pdf}
              pageNumber={page}
              scale={scale}
              onPageSize={handlePageSize}
            />
          </div>
        )}
      </main>

      {isImmersive && (
        <FullscreenToggleButton
          variant="floating"
          isFullscreen
          fullscreenSupported={fullscreenSupported}
          onToggle={toggleFullscreen}
        />
      )}

      {showShortcuts && (
        <ReaderShortcuts onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  )
}
