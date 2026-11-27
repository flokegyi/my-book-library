import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

const DAY_MS = 86_400_000
const MAX_SESSION_SECONDS = 4 * 60 * 60

const statsQuerySchema = z
  .object({
    days: z.preprocess(
      (value) => (value === undefined ? 7 : Number(value)),
      z.union([z.literal(7), z.literal(14), z.literal(30)]),
    ),
    offset: z.preprocess(
      (value) => (value === undefined || value === '' ? 0 : Number(value)),
      z.number().int().min(-840).max(840),
    ),
  })
  .strict()

function validationError(res, error) {
  return res.status(400).json({
    error: { message: error.issues[0]?.message ?? 'Invalid request' },
  })
}

function dayKey(date, offsetMinutes) {
  return new Date(date.getTime() + offsetMinutes * 60_000)
    .toISOString()
    .slice(0, 10)
}

function calculateStats(sessions, days, offsetMinutes) {
  const now = new Date()
  const offsetMs = offsetMinutes * 60_000
  const daily = []
  const firstDay = new Date(now.getTime() + offsetMs - (days - 1) * DAY_MS)

  for (let index = 0; index < days; index += 1) {
    const date = new Date(firstDay.getTime() + index * DAY_MS)
    daily.push({
      date: date.toISOString().slice(0, 10),
      seconds: 0,
      sessions: 0,
    })
  }

  const dailyByDate = new Map(daily.map((day) => [day.date, day]))
  const activeDays = new Set()
  let readingSeconds = 0
  let pagesRead = 0

  for (const session of sessions) {
    const activityAt = session.endedAt ?? session.startedAt
    const key = dayKey(activityAt, offsetMinutes)
    activeDays.add(key)

    const duration = session.endedAt
      ? Math.min(
          MAX_SESSION_SECONDS,
          Math.max(
            0,
            Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000),
          ),
        )
      : 0

    readingSeconds += duration
    pagesRead += Math.max(
      0,
      (session.endPage ?? session.startPage) - session.startPage + 1,
    )

    const bucket = dailyByDate.get(key)

    if (bucket) {
      bucket.seconds += duration
      bucket.sessions += 1
    }
  }

  const cursor = new Date(now.getTime() + offsetMs)

  if (!activeDays.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  let streakDays = 0

  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streakDays += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return {
    readingSeconds,
    pagesRead,
    streakDays,
    daily: daily.map((day) => ({
      date: day.date,
      seconds: day.seconds,
      minutes: Math.round(day.seconds / 60),
      sessions: day.sessions,
    })),
  }
}

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

router.use(requireAuth)

router.get('/stats', async (req, res) => {
  const parsed = statsQuerySchema.safeParse(req.query)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const { days, offset } = parsed.data

  const [totalBooks, completedBooks, readingBooks, sessions] = await Promise.all([
    prisma.book.count({ where: { userId: req.user.id } }),
    prisma.book.count({
      where: { userId: req.user.id, status: 'COMPLETED' },
    }),
    prisma.book.count({
      where: { userId: req.user.id, status: 'READING' },
    }),
    prisma.readingSession.findMany({
      where: { userId: req.user.id },
      select: {
        startPage: true,
        endPage: true,
        startedAt: true,
        endedAt: true,
      },
      orderBy: { startedAt: 'asc' },
    }),
  ])

  const calculated = calculateStats(sessions, days, offset)

  res.json({
    stats: {
      totalBooks,
      completedBooks,
      readingBooks,
      ...calculated,
    },
  })
})

export default router
