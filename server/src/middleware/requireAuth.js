import { AUTH_COOKIE_NAME, clearAuthCookie, verifyAuthToken } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'

function unauthorized(res) {
  clearAuthCookie(res)
  return res.status(401).json({
    error: { message: 'Authentication required' },
  })
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME]

  if (!token) {
    return unauthorized(res)
  }

  try {
    const payload = verifyAuthToken(token)

    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.sub !== 'string' ||
      typeof payload.tokenVersion !== 'number'
    ) {
      return unauthorized(res)
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        tokenVersion: true,
      },
    })

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return unauthorized(res)
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    }

    next()
  } catch {
    return unauthorized(res)
  }
}
