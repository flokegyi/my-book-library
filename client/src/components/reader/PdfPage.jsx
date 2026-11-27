import { useEffect, useRef, useState } from 'react'
import { TextLayer } from 'pdfjs-dist'

export default function PdfPage({ pdf, pageNumber, scale, onPageSize }) {
  const canvasRef = useRef(null)
  const textLayerRef = useRef(null)
  const onPageSizeRef = useRef(onPageSize)
  onPageSizeRef.current = onPageSize

  const [dimensions, setDimensions] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    let renderTask = null
    let textLayer = null

    async function renderPage() {
      setStatus('loading')

      const page = await pdf.getPage(pageNumber)

      if (cancelled) {
        return
      }

      const baseViewport = page.getViewport({ scale: 1 })
      onPageSizeRef.current?.({
        width: baseViewport.width,
        height: baseViewport.height,
      })

      const viewport = page.getViewport({ scale })
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d', { alpha: false })

      canvas.width = Math.floor(viewport.width * pixelRatio)
      canvas.height = Math.floor(viewport.height * pixelRatio)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`

      setDimensions({ width: viewport.width, height: viewport.height })
      textLayerRef.current.replaceChildren()

      renderTask = page.render({
        canvasContext: context,
        viewport,
        transform:
          pixelRatio === 1
            ? null
            : [pixelRatio, 0, 0, pixelRatio, 0, 0],
      })

      textLayerRef.current.style.setProperty(
        '--total-scale-factor',
        String(scale),
      )
      textLayer = new TextLayer({
        textContentSource: page.streamTextContent(),
        container: textLayerRef.current,
        viewport,
      })

      await Promise.all([renderTask.promise, textLayer.render()])

      if (!cancelled) {
        setStatus('ready')
      }
    }

    renderPage().catch((error) => {
      if (
        !cancelled &&
        error?.name !== 'RenderingCancelledException' &&
        error?.name !== 'AbortException'
      ) {
        console.error('Could not render PDF page:', error)
        setStatus('error')
      }
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
      textLayer?.cancel()
    }
  }, [pdf, pageNumber, scale])

  return (
    <div
      className="relative mx-auto bg-white shadow-2xl ring-1 ring-black/10"
      style={{
        width: dimensions?.width ?? 612,
        height: dimensions?.height ?? 792,
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <div ref={textLayerRef} className="pdf-text-layer" />

      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-xs font-medium text-stone-500">
          Rendering page…
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 px-6 text-center text-sm text-red-600">
          This page could not be rendered.
        </div>
      )}
    </div>
  )
}
