import {
  createCanvas,
  DOMMatrix,
  ImageData,
  Path2D,
} from '@napi-rs/canvas'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

globalThis.DOMMatrix ??= DOMMatrix
globalThis.ImageData ??= ImageData
globalThis.Path2D ??= Path2D

const COVER_WIDTH = 640
const COVER_MAX_HEIGHT = 900
const JPEG_QUALITY = 82

function cleanText(value, maxLength) {
  if (typeof value !== 'string') {
    return null
  }

  const cleaned = value.replace(/\s+/g, ' ').trim()

  if (!cleaned) {
    return null
  }

  return cleaned.slice(0, maxLength)
}

export class PdfProcessingError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PdfProcessingError'
  }
}

export async function processPdf(buffer) {
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: true,
  })

  try {
    const pdf = await loadingTask.promise
    const metadata = await pdf.getMetadata().catch(() => ({ info: {} }))
    const info = metadata.info ?? {}
    const page = await pdf.getPage(1)
    const baseViewport = page.getViewport({ scale: 1 })

    let scale = COVER_WIDTH / baseViewport.width

    if (baseViewport.height * scale > COVER_MAX_HEIGHT) {
      scale = COVER_MAX_HEIGHT / baseViewport.height
    }

    const viewport = page.getViewport({ scale })
    const width = Math.max(1, Math.ceil(viewport.width))
    const height = Math.max(1, Math.ceil(viewport.height))
    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
      background: '#ffffff',
    }).promise

    page.cleanup?.()

    return {
      pageCount: pdf.numPages,
      title: cleanText(info.Title, 300),
      author: cleanText(info.Author, 200),
      description: cleanText(info.Subject, 5000),
      coverBuffer: canvas.toBuffer('image/jpeg', JPEG_QUALITY),
      coverContentType: 'image/jpeg',
    }
  } catch (error) {
    if (error?.name === 'PasswordException') {
      throw new PdfProcessingError(
        'Password-protected PDFs are not supported',
      )
    }

    if (error instanceof PdfProcessingError) {
      throw error
    }

    throw new PdfProcessingError('The file is not a readable PDF')
  } finally {
    await loadingTask.destroy().catch(() => {})
  }
}
