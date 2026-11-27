import { useCallback, useEffect, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { api } from '../lib/apiClient.js'

GlobalWorkerOptions.workerSrc = workerUrl

function isExpiredUrlError(error) {
  const status = Number(
    error?.status ?? error?.response?.status ?? error?.statusCode ?? 0,
  )
  const message = String(error?.message ?? '')

  if (status === 401 || status === 403) {
    return true
  }

  if (
    status === 400 &&
    /invalidjwt|jwt|token|signature|exp(ired)?\b/i.test(message)
  ) {
    return true
  }

  return /expired|signature|token|unauthori[sz]ed|forbidden|access denied/i.test(
    message,
  )
}

function describeError(error) {
  if (error?.name === 'PasswordException') {
    return 'This PDF is password protected.'
  }

  if (error?.message) {
    return error.message
  }

  return 'Unable to open this PDF.'
}

export function usePdfDocument(bookId) {
  const [nonce, setNonce] = useState(0)
  const [state, setState] = useState({
    pdf: null,
    loading: true,
    error: null,
    retrying: false,
  })

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false
    let loadingTask = null

    setState({ pdf: null, loading: true, error: null, retrying: false })

    function openUrl(url) {
      loadingTask = getDocument({ url })
      return loadingTask.promise
    }

    async function openDocument() {
      try {
        const signed = await api.get(`/books/${bookId}/read-url`)
        let pdf

        try {
          pdf = await openUrl(signed.url)
        } catch (error) {
          if (!isExpiredUrlError(error)) {
            throw error
          }

          setState((current) => ({ ...current, retrying: true }))
          await loadingTask?.destroy?.()
          loadingTask = null

          const refreshed = await api.get(
            `/books/${bookId}/read-url?retry=1`,
          )
          pdf = await openUrl(refreshed.url)
        }

        if (cancelled) {
          await loadingTask.destroy()
          return
        }

        setState({ pdf, loading: false, error: null, retrying: false })
      } catch (error) {
        if (!cancelled) {
          setState({
            pdf: null,
            loading: false,
            error: describeError(error),
            retrying: false,
          })
        }
      }
    }

    openDocument()

    return () => {
      cancelled = true
      loadingTask?.destroy?.()
    }
  }, [bookId, nonce])

  return { ...state, reload }
}
