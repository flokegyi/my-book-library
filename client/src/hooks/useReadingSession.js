import { useCallback, useEffect, useRef } from 'react'
import { useRecordSession } from './useBook.js'
import { api } from '../lib/apiClient.js'

const IDLE_TIMEOUT_MS = 60_000
const MIN_SESSION_MS = 1_000

export function useReadingSession({ bookId, page, enabled }) {
  const recordSession = useRecordSession()
  const mutateRef = useRef(recordSession.mutate)
  mutateRef.current = recordSession.mutate

  const pageRef = useRef(page)
  const sessionRef = useRef(null)
  const idleTimerRef = useRef(null)

  useEffect(() => {
    pageRef.current = page
  }, [page])

  const finishSession = useCallback(
    ({ keepalive = false, endPage } = {}) => {
      const session = sessionRef.current

      if (!session) {
        return
      }

      sessionRef.current = null
      window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null

      if (Date.now() - Date.parse(session.startedAt) < MIN_SESSION_MS) {
        return
      }

      const payload = {
        startPage: session.startPage,
        endPage: endPage ?? pageRef.current,
        startedAt: session.startedAt,
        endedAt: new Date().toISOString(),
      }

      if (keepalive) {
        api.postKeepalive(`/books/${bookId}/sessions`, payload).catch(() => {})
        return
      }

      mutateRef.current({ id: bookId, ...payload })
    },
    [bookId],
  )

  const scheduleIdleTimeout = useCallback(() => {
    window.clearTimeout(idleTimerRef.current)
    idleTimerRef.current = window.setTimeout(() => {
      finishSession()
    }, IDLE_TIMEOUT_MS)
  }, [finishSession])

  const startSession = useCallback(() => {
    if (sessionRef.current) {
      return
    }

    sessionRef.current = {
      startPage: pageRef.current,
      startedAt: new Date().toISOString(),
    }
    scheduleIdleTimeout()
  }, [scheduleIdleTimeout])

  const noteActivity = useCallback(() => {
    if (!enabled) {
      return
    }

    if (!sessionRef.current) {
      startSession()
      return
    }

    scheduleIdleTimeout()
  }, [enabled, scheduleIdleTimeout, startSession])

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    startSession()

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        finishSession({ keepalive: true })
      } else {
        startSession()
      }
    }

    function handlePageHide() {
      finishSession({ keepalive: true })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      finishSession({ keepalive: true })
    }
  }, [enabled, finishSession, startSession])

  return { noteActivity, finishSession }
}
