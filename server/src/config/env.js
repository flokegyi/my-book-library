import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({
  path: path.resolve(currentDir, '../../.env'),
  quiet: true,
})

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_URL: z.string().url().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('books'),
  TRUST_PROXY: z.string().optional(),
  SIGNED_PDF_URL_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(86400)
    .default(900),
  MAX_PDF_SIZE_MB: z.coerce.number().int().min(1).max(200).default(50),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).max(72).optional(),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Invalid environment configuration:')
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join('.') || 'environment'}: ${issue.message}`)
  }
  process.exit(1)
}

export const env = result.data
