import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import express from 'express'
import { env } from './config/env.js'
import authRouter from './routes/auth.js'
import booksRouter from './routes/books.js'
import readingRouter from './routes/reading.js'
import tagsRouter from './routes/tags.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(currentDir, '../../client/dist')

function resolveTrustProxy(value) {
  if (!value) {
    return false
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return /^\d+$/.test(value) ? Number(value) : value
}

export const app = express()

app.disable('x-powered-by')
app.set('trust proxy', resolveTrustProxy(env.TRUST_PROXY))
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.set('X-Frame-Options', 'DENY')
  next()
})
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRouter)
app.use('/api/books', booksRouter)
app.use('/api/reading', readingRouter)
app.use('/api/tags', tagsRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: { message: 'API route not found' } })
})

if (env.NODE_ENV === 'production') {
  app.use(express.static(clientDist))

  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      return next()
    }

    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use((err, _req, res, _next) => {
  console.error(err)
  const status = err.status ?? 500

  res.status(status).json({
    error: {
      message: status >= 500 ? 'Internal server error' : err.message,
    },
  })
})
