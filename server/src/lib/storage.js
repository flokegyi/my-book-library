import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

export const storageBucket = env.SUPABASE_STORAGE_BUCKET

function resolveStorageUrl() {
  if (env.SUPABASE_STORAGE_URL) {
    return env.SUPABASE_STORAGE_URL
  }

  const url = new URL(env.SUPABASE_URL)
  const project = url.hostname.match(
    /^([a-z0-9]{20})\.supabase\.co$/,
  )

  if (project) {
    url.hostname = `${project[1]}.storage.supabase.co`
    return url.origin
  }

  return env.SUPABASE_URL
}

const supabase = createClient(
  resolveStorageUrl(),
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)

let bucketReady

export async function ensureStorageBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { error } = await supabase.storage.createBucket(storageBucket, {
        public: false,
        fileSizeLimit: env.MAX_PDF_SIZE_MB * 1024 * 1024,
        allowedMimeTypes: ['application/pdf', 'image/jpeg'],
      })

      const alreadyExists =
        error &&
        (error.statusCode === 409 || /already exists/i.test(error.message))

      if (error && !alreadyExists) {
        throw error
      }

      if (alreadyExists) {
        const { data: bucket, error: bucketError } =
          await supabase.storage.getBucket(storageBucket)

        if (bucketError) {
          throw bucketError
        }

        if (bucket?.public !== false) {
          throw new Error(`Storage bucket "${storageBucket}" must be private`)
        }
      }
    })().catch((error) => {
      bucketReady = undefined
      throw error
    })
  }

  return bucketReady
}

export async function uploadObject(path, buffer, contentType) {
  await ensureStorageBucket()

  const { error } = await supabase.storage
    .from(storageBucket)
    .upload(path, buffer, {
      contentType,
      upsert: false,
      cacheControl: '3600',
    })

  if (error) {
    throw error
  }

  return path
}

export async function createSignedUrl(path, expiresInSeconds) {
  const { data, error } = await supabase.storage
    .from(storageBucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw error ?? new Error('Supabase did not return a signed URL')
  }

  return {
    url: data.signedUrl,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  }
}

export async function removeObjects(paths) {
  const validPaths = paths.filter(Boolean)

  if (validPaths.length === 0) {
    return
  }

  const { error } = await supabase.storage
    .from(storageBucket)
    .remove(validPaths)

  if (error) {
    throw error
  }
}

export async function downloadObject(path) {
  const { data, error } = await supabase.storage
    .from(storageBucket)
    .download(path)

  if (error) {
    throw error
  }

  return Buffer.from(await data.arrayBuffer())
}
