import crypto from 'node:crypto'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { env } from '../config/env.js'
import { PdfProcessingError, processPdf } from '../lib/pdf.js'
import { prisma } from '../lib/prisma.js'
import {
  createSignedUrl,
  downloadObject,
  removeObjects,
  uploadObject,
} from '../lib/storage.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_PDF_SIZE_MB * 1024 * 1024,
    files: 1,
  },
})

const uploadSingle = upload.single('file')
const bookStatusSchema = z.enum(['UNREAD', 'READING', 'COMPLETED'])
const uuidSchema = z.string().uuid()
const MAX_PAGE_NUMBER = 2_147_483_647

const bookSelect = {
  id: true,
  title: true,
  author: true,
  description: true,
  coverPath: true,
  fileSize: true,
  pageCount: true,
  status: true,
  isPinned: true,
  lastReadPage: true,
  lastReadAt: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    select: { id: true, name: true, color: true },
    orderBy: { name: 'asc' },
  },
}

const emptyToUndefined = (value) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const optionalText = (max) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max).optional(),
  )

const nullableText = (max) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? null : value,
    z.string().trim().max(max).nullable().optional(),
  )

function parseTagIds(value) {
  if (value === undefined || value === null || value === '') {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  return value
}

const listQuerySchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  status: z.preprocess(emptyToUndefined, bookStatusSchema.optional()),
  tagId: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(['date', 'title', 'activity']).default('date'),
  ),
})

const uploadSchema = z
  .object({
    title: optionalText(300),
    author: optionalText(200),
    description: optionalText(5000),
    status: z.preprocess(emptyToUndefined, bookStatusSchema.default('UNREAD')),
    tagIds: z.preprocess(
      parseTagIds,
      z.array(uuidSchema).max(30),
    ),
  })
  .strict()

const updateBookSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(300).optional(),
    author: nullableText(200),
    description: nullableText(5000),
    status: bookStatusSchema.optional(),
    tagIds: z.array(uuidSchema).max(30).optional(),
  })
  .strict()

const pinSchema = z.object({ pinned: z.boolean() }).strict()

const bookmarkSchema = z
  .object({
    page: z.number().int().positive().max(MAX_PAGE_NUMBER),
    label: optionalText(120),
    note: optionalText(1000),
  })
  .strict()

const timestampSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  'Invalid timestamp',
)

const progressSchema = z
  .object({
    page: z.number().int().positive().max(MAX_PAGE_NUMBER),
    status: z.enum(['READING', 'COMPLETED']).optional(),
  })
  .strict()

const sessionSchema = z
  .object({
    startPage: z.number().int().positive().max(MAX_PAGE_NUMBER),
    endPage: z.number().int().positive().max(MAX_PAGE_NUMBER).optional(),
    startedAt: timestampSchema.optional(),
    endedAt: timestampSchema.optional(),
  })
  .strict()
  .refine(
    (data) => data.endPage === undefined || data.endPage >= data.startPage,
    { message: 'End page cannot be before start page', path: ['endPage'] },
  )
  .refine((data) => {
    const latest = Date.now() + 5 * 60 * 1000
    const startedAt = data.startedAt ? Date.parse(data.startedAt) : latest
    const endedAt = data.endedAt ? Date.parse(data.endedAt) : startedAt

    return startedAt >= 0 && endedAt >= 0 && startedAt <= latest && endedAt <= latest
  }, { message: 'Invalid timestamp', path: ['startedAt'] })

function clampPage(page, pageCount) {
  return pageCount && pageCount > 0 ? Math.min(page, pageCount) : page
}

function validationError(res, error) {
  return res.status(400).json({
    error: { message: error.issues[0]?.message ?? 'Invalid request' },
  })
}

function notFound(res, message = 'Book not found') {
  return res.status(404).json({ error: { message } })
}

function toBookResponse(book) {
  const { coverPath, ...rest } = book
  return {
    ...rest,
    coverUrl: coverPath ? `/api/books/${book.id}/cover` : null,
  }
}

function toBookResponses(books) {
  return books.map(toBookResponse)
}

function toBookmarkResponse(bookmark) {
  return {
    id: bookmark.id,
    page: bookmark.page,
    label: bookmark.label,
    note: bookmark.note,
    createdAt: bookmark.createdAt,
    updatedAt: bookmark.updatedAt,
  }
}

async function getBookForUser(id, userId) {
  return prisma.book.findFirst({
    where: { id, userId },
    select: bookSelect,
  })
}

async function resolveTags(userId, tagIds) {
  const uniqueIds = [...new Set(tagIds)]

  if (uniqueIds.length === 0) {
    return []
  }

  const tags = await prisma.tag.findMany({
    where: {
      userId,
      id: { in: uniqueIds },
    },
    select: { id: true },
  })

  return tags.length === uniqueIds.length ? tags : null
}

function handleUpload(req, res, next) {
  uploadSingle(req, res, (error) => {
    if (!error) {
      return next()
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        error: {
          message:
            error.code === 'LIMIT_FILE_SIZE'
              ? `PDF must be ${env.MAX_PDF_SIZE_MB} MB or smaller`
              : 'Invalid file upload',
        },
      })
    }

    next(error)
  })
}

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

router.use(requireAuth)

router.get('/', async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const { q, status, tagId, sort } = parsed.data
  const where = { userId: req.user.id }

  if (status) {
    where.status = status
  }

  if (tagId) {
    where.tags = { some: { id: tagId } }
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { author: { contains: q, mode: 'insensitive' } },
    ]
  }

  const orderBy =
    sort === 'title'
      ? [{ title: 'asc' }]
      : sort === 'activity'
        ? [
            { lastReadAt: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
          ]
        : [{ createdAt: 'desc' }]

  const books = await prisma.book.findMany({
    where,
    orderBy,
    select: bookSelect,
  })

  res.json({ books: toBookResponses(books) })
})

router.post('/', handleUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { message: 'PDF file is required' } })
  }

  const header = req.file.buffer.subarray(0, 5).toString('ascii')

  if (header !== '%PDF-') {
    return res
      .status(400)
      .json({ error: { message: 'The uploaded file is not a valid PDF' } })
  }

  const parsed = uploadSchema.safeParse(req.body)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const tagRecords = await resolveTags(req.user.id, parsed.data.tagIds)

  if (tagRecords === null) {
    return res.status(400).json({
      error: { message: 'One or more categories are invalid' },
    })
  }

  let processed

  try {
    processed = await processPdf(req.file.buffer)
  } catch (error) {
    if (error instanceof PdfProcessingError) {
      return res.status(400).json({ error: { message: error.message } })
    }

    console.error('PDF processing failed:', error.message)
    return res
      .status(400)
      .json({ error: { message: 'The PDF could not be processed' } })
  }

  const originalName = req.file.originalname || 'Untitled.pdf'
  const fallbackTitle =
    path.basename(originalName, path.extname(originalName)).trim() ||
    'Untitled'
  const title = (
    parsed.data.title ??
    processed.title ??
    fallbackTitle
  ).slice(0, 300)
  const author = (parsed.data.author ?? processed.author)?.slice(0, 200) ?? null
  const description =
    (parsed.data.description ?? processed.description)?.slice(0, 5000) ?? null
  const bookId = crypto.randomUUID()
  const storagePath = `${req.user.id}/${bookId}.pdf`
  const coverPath = processed.coverBuffer
    ? `${req.user.id}/covers/${bookId}.jpg`
    : null

  let pdfUploaded = false
  let coverUploaded = false
  let book

  try {
    await uploadObject(storagePath, req.file.buffer, 'application/pdf')
    pdfUploaded = true

    if (coverPath) {
      await uploadObject(
        coverPath,
        processed.coverBuffer,
        processed.coverContentType,
      )
      coverUploaded = true
    }

    book = await prisma.book.create({
      data: {
        id: bookId,
        userId: req.user.id,
        title,
        author,
        description,
        storagePath,
        coverPath,
        fileSize: req.file.size,
        pageCount: processed.pageCount,
        status: parsed.data.status,
        lastReadAt: ['READING', 'COMPLETED'].includes(parsed.data.status)
          ? new Date()
          : null,
        tags: {
          connect: tagRecords.map((tag) => ({ id: tag.id })),
        },
      },
      select: bookSelect,
    })
  } catch (error) {
    await removeObjects([
      pdfUploaded ? storagePath : null,
      coverUploaded ? coverPath : null,
    ]).catch((cleanupError) => {
      console.error('Upload cleanup failed:', cleanupError.message)
    })

    console.error('Book upload failed:', error.message)
    return res
      .status(500)
      .json({ error: { message: 'Unable to upload book' } })
  }

  res.status(201).json({ book: toBookResponse(book) })
})

router.get('/:id/cover', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)

  if (!id.success) {
    return notFound(res, 'Cover not found')
  }

  const book = await prisma.book.findFirst({
    where: { id: id.data, userId: req.user.id },
    select: { coverPath: true },
  })

  if (!book?.coverPath) {
    return notFound(res, 'Cover not found')
  }

  try {
    const cover = await downloadObject(book.coverPath)
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': String(cover.length),
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    })
    res.send(cover)
  } catch (error) {
    console.error('Could not load cover:', error.message)
    return notFound(res, 'Cover not found')
  }
})

router.get('/:id/read-url', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)

  if (!id.success) {
    return notFound(res)
  }

  const book = await prisma.book.findFirst({
    where: { id: id.data, userId: req.user.id },
    select: { storagePath: true },
  })

  if (!book?.storagePath) {
    return notFound(res)
  }

  try {
    const signed = await createSignedUrl(
      book.storagePath,
      env.SIGNED_PDF_URL_TTL_SECONDS,
    )
    res.json(signed)
  } catch (error) {
    console.error('Could not create a PDF reading link:', error.message)
    return res.status(502).json({
      error: { message: 'Unable to create a secure reading link' },
    })
  }
})

router.patch('/:id/progress', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)

  if (!id.success) {
    return notFound(res)
  }

  const parsed = progressSchema.safeParse(req.body)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const existing = await getBookForUser(id.data, req.user.id)

  if (!existing) {
    return notFound(res)
  }

  const data = {
    lastReadPage: clampPage(parsed.data.page, existing.pageCount),
    lastReadAt: new Date(),
  }

  if (parsed.data.status) {
    data.status = parsed.data.status
  } else if (existing.status === 'UNREAD') {
    data.status = 'READING'
  }

  const book = await prisma.book.update({
    where: { id: id.data },
    data,
    select: bookSelect,
  })

  res.json({ book: toBookResponse(book) })
})

router.post('/:id/sessions', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)

  if (!id.success) {
    return notFound(res)
  }

  const parsed = sessionSchema.safeParse(req.body)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const book = await prisma.book.findFirst({
    where: { id: id.data, userId: req.user.id },
    select: { pageCount: true },
  })

  if (!book) {
    return notFound(res)
  }

  const startPage = clampPage(parsed.data.startPage, book.pageCount)
  const endPage = parsed.data.endPage
    ? clampPage(parsed.data.endPage, book.pageCount)
    : startPage
  const startedAt = parsed.data.startedAt
    ? new Date(parsed.data.startedAt)
    : new Date()
  let endedAt = parsed.data.endedAt ? new Date(parsed.data.endedAt) : null

  if (endedAt && endedAt < startedAt) {
    endedAt = startedAt
  }

  const session = await prisma.readingSession.create({
    data: {
      userId: req.user.id,
      bookId: id.data,
      startPage,
      endPage,
      startedAt,
      endedAt,
    },
    select: {
      id: true,
      startPage: true,
      endPage: true,
      startedAt: true,
      endedAt: true,
    },
  })

  res.status(201).json({ session })
})

router.get('/:id/bookmarks', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)

  if (!id.success) {
    return notFound(res)
  }

  const book = await prisma.book.findFirst({
    where: { id: id.data, userId: req.user.id },
    select: { id: true },
  })

  if (!book) {
    return notFound(res)
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { bookId: id.data },
    select: {
      id: true,
      page: true,
      label: true,
      note: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ page: 'asc' }, { createdAt: 'asc' }],
  })

  res.json({ bookmarks: bookmarks.map(toBookmarkResponse) })
})

router.post('/:id/bookmarks', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)

  if (!id.success) {
    return notFound(res)
  }

  const parsed = bookmarkSchema.safeParse(req.body)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const book = await prisma.book.findFirst({
    where: { id: id.data, userId: req.user.id },
    select: { pageCount: true },
  })

  if (!book) {
    return notFound(res)
  }

  const bookmark = await prisma.bookmark.create({
    data: {
      bookId: id.data,
      page: clampPage(parsed.data.page, book.pageCount),
      label: parsed.data.label,
      note: parsed.data.note,
    },
    select: {
      id: true,
      page: true,
      label: true,
      note: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  res.status(201).json({ bookmark: toBookmarkResponse(bookmark) })
})

router.delete('/:id/bookmarks/:bookmarkId', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)
  const bookmarkId = uuidSchema.safeParse(req.params.bookmarkId)

  if (!id.success || !bookmarkId.success) {
    return notFound(res, 'Bookmark not found')
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: {
      id: bookmarkId.data,
      bookId: id.data,
      book: { userId: req.user.id },
    },
    select: { id: true },
  })

  if (!bookmark) {
    return notFound(res, 'Bookmark not found')
  }

  await prisma.bookmark.delete({ where: { id: bookmark.id } })

  res.status(204).end()
})

router.get('/:id', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)

  if (!id.success) {
    return notFound(res)
  }

  const book = await getBookForUser(id.data, req.user.id)

  if (!book) {
    return notFound(res)
  }

  res.json({ book: toBookResponse(book) })
})

router.patch('/:id/pin', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)

  if (!id.success) {
    return notFound(res)
  }

  const parsed = pinSchema.safeParse(req.body)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const existing = await getBookForUser(id.data, req.user.id)

  if (!existing) {
    return notFound(res)
  }

  const book = await prisma.book.update({
    where: { id: id.data },
    data: { isPinned: parsed.data.pinned },
    select: bookSelect,
  })

  res.json({ book: toBookResponse(book) })
})

router.patch('/:id', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)

  if (!id.success) {
    return notFound(res)
  }

  const parsed = updateBookSchema.safeParse(req.body)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const existing = await prisma.book.findFirst({
    where: { id: id.data, userId: req.user.id },
    select: { id: true, status: true },
  })

  if (!existing) {
    return notFound(res)
  }

  let tagRecords = null

  if (parsed.data.tagIds !== undefined) {
    tagRecords = await resolveTags(req.user.id, parsed.data.tagIds)

    if (tagRecords === null) {
      return res.status(400).json({
        error: { message: 'One or more categories are invalid' },
      })
    }
  }

  const data = {}

  if (parsed.data.title !== undefined) data.title = parsed.data.title
  if (parsed.data.author !== undefined) data.author = parsed.data.author
  if (parsed.data.description !== undefined) {
    data.description = parsed.data.description
  }
  if (parsed.data.status !== undefined) data.status = parsed.data.status

  if (
    parsed.data.status &&
    parsed.data.status !== existing.status &&
    ['READING', 'COMPLETED'].includes(parsed.data.status)
  ) {
    data.lastReadAt = new Date()
  }

  if (tagRecords !== null) {
    data.tags = { set: tagRecords.map((tag) => ({ id: tag.id })) }
  }

  const book = await prisma.book.update({
    where: { id: id.data },
    data,
    select: bookSelect,
  })

  res.json({ book: toBookResponse(book) })
})

router.delete('/:id', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id)

  if (!id.success) {
    return notFound(res)
  }

  const book = await prisma.book.findFirst({
    where: { id: id.data, userId: req.user.id },
    select: { id: true, storagePath: true, coverPath: true },
  })

  if (!book) {
    return notFound(res)
  }

  await prisma.book.delete({ where: { id: book.id } })

  try {
    await removeObjects([book.storagePath, book.coverPath])
  } catch (error) {
    console.error('Could not remove book files:', error.message)
  }

  res.status(204).end()
})

export default router
