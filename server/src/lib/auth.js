import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const AUTH_COOKIE_NAME = 'book_library_session'
export const PASSWORD_SALT_ROUNDS = 12

const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}

export function createAuthToken(user) {
  return jwt.sign({ tokenVersion: user.tokenVersion }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: AUTH_TOKEN_TTL_SECONDS,
    algorithm: 'HS256',
  })
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: AUTH_TOKEN_TTL_SECONDS * 1000,
  })
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions)
}
