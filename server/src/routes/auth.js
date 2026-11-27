import bcrypt from 'bcryptjs'
import { Router } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { z } from 'zod'
import {
  clearAuthCookie,
  createAuthToken,
  PASSWORD_SALT_ROUNDS,
  setAuthCookie,
} from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

const DUMMY_PASSWORD_HASH =
  '$2b$12$Ye0aCdCm2DWeM1/gb1X6Z.wVmvY9DnhK6PXajJIEqHuXdkepx8Bzi'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    res.status(429).json({
      error: { message: 'Too many login attempts. Try again later.' },
    })
  },
})

const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ''),
  handler: (_req, res) => {
    res.status(429).json({
      error: { message: 'Too many password attempts. Try again later.' },
    })
  },
})

const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .max(72, 'Password is too long'),
  })
  .strict()

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(72, 'Password is too long'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(72, 'New password must be at most 72 characters'),
  })
  .strict()

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  }
}

function validationError(res, error) {
  return res.status(400).json({
    error: { message: error.issues[0]?.message ?? 'Invalid request' },
  })
}

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)

  if (!parsed.success) {
    return validationError(res, parsed.error)
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      passwordHash: true,
      tokenVersion: true,
    },
  })

  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  )

  if (!user || !passwordMatches) {
    return res.status(401).json({
      error: { message: 'Invalid email or password' },
    })
  }

  setAuthCookie(res, createAuthToken(user))
  res.json({ user: publicUser(user) })
})

router.post('/logout', (_req, res) => {
  clearAuthCookie(res)
  res.status(204).end()
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

router.patch(
  '/password',
  requireAuth,
  passwordChangeLimiter,
  async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body)

    if (!parsed.success) {
      return validationError(res, parsed.error)
    }

    const { currentPassword, newPassword } = parsed.data
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { passwordHash: true },
    })

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    )

    if (!user || !currentPasswordMatches) {
      return res.status(400).json({
        error: { message: 'Current password is incorrect' },
      })
    }

    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS)

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    })

    clearAuthCookie(res)
    res.json({ message: 'Password updated. Please sign in again.' })
  },
)

export default router
