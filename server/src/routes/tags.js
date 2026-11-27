import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

const tagSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(40),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value')
      .nullable()
      .optional(),
  })
  .strict()

const updateTagSchema = tagSchema.partial()

function validationError(res, error) {
  return res.status(400).json({
    error: { message: error.issues[0]?.message ?? 'Invalid request' },
  })
}

function serializeTag(tag) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    bookCount: tag._count.books,
    createdAt: tag.createdAt,
  }
}

router.use(requireAuth)

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

function isUniqueConstraintError(error) {
  return error?.code === 'P2002'
}

function conflict(res) {
  return res.status(409).json({
    error: { message: 'A category with this name already exists' },
  })
}

router.get('/', async (req, res) => {
  const tags = await prisma.tag.findMany({
    where: { userId: req.user.id },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { books: true } },
    },
  })

  res.json({ tags: tags.map(serializeTag) })
})

router.post('/', async (req, res) => {
  const parsed = tagSchema.safeParse(req.body)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const name = parsed.data.name
  const existing = await prisma.tag.findFirst({
    where: {
      userId: req.user.id,
      name: { equals: name, mode: 'insensitive' },
    },
    select: { id: true },
  })

  if (existing) {
    return res.status(409).json({
      error: { message: 'A category with this name already exists' },
    })
  }

  let tag

  try {
    tag = await prisma.tag.create({
      data: {
        userId: req.user.id,
        name,
        color: parsed.data.color ?? null,
      },
      include: {
        _count: { select: { books: true } },
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return conflict(res)
    }

    throw error
  }

  res.status(201).json({ tag: serializeTag(tag) })
})

router.patch('/:id', async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id)

  if (!id.success) {
    return res.status(404).json({ error: { message: 'Category not found' } })
  }

  const parsed = updateTagSchema.safeParse(req.body)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const existing = await prisma.tag.findFirst({
    where: { id: id.data, userId: req.user.id },
    select: { id: true },
  })

  if (!existing) {
    return res.status(404).json({ error: { message: 'Category not found' } })
  }

  if (parsed.data.name) {
    const duplicate = await prisma.tag.findFirst({
      where: {
        userId: req.user.id,
        id: { not: id.data },
        name: { equals: parsed.data.name, mode: 'insensitive' },
      },
      select: { id: true },
    })

    if (duplicate) {
      return res.status(409).json({
        error: { message: 'A category with this name already exists' },
      })
    }
  }

  let tag

  try {
    tag = await prisma.tag.update({
      where: { id: id.data },
      data: parsed.data,
      include: {
        _count: { select: { books: true } },
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return conflict(res)
    }

    throw error
  }

  res.json({ tag: serializeTag(tag) })
})

router.delete('/:id', async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id)

  if (!id.success) {
    return res.status(404).json({ error: { message: 'Category not found' } })
  }

  const result = await prisma.tag.deleteMany({
    where: { id: id.data, userId: req.user.id },
  })

  if (result.count === 0) {
    return res.status(404).json({ error: { message: 'Category not found' } })
  }

  res.status(204).end()
})

export default router
