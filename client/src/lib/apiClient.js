import { queryClient } from './queryClient.js'

const API_BASE_URL = '/api'

function handleUnauthorized(path) {
  if (
    typeof window === 'undefined' ||
    path === '/auth/login' ||
    window.location.pathname === '/login'
  ) {
    return
  }

  queryClient.clear()
  window.location.assign('/login')
}

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function request(path, options = {}) {
  const { method = 'GET', body, headers = {}, signal } = options
  const hasBody = body !== undefined && body !== null
  const isFormData = hasBody && body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: hasBody ? (isFormData ? body : JSON.stringify(body)) : undefined,
    credentials: 'same-origin',
    signal,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(path)
    }

    const message =
      payload?.error?.message ?? `Request failed (${response.status})`

    throw new ApiError(message, {
      status: response.status,
      details: payload,
    })
  }

  return payload
}

export function upload(path, formData, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open('POST', `${API_BASE_URL}${path}`)
    xhr.withCredentials = true
    xhr.setRequestHeader('Accept', 'application/json')

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      let payload = null

      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        payload = null
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload)
        return
      }

      reject(
        new ApiError(
          payload?.error?.message ?? `Request failed (${xhr.status})`,
          { status: xhr.status, details: payload },
        ),
      )
    })

    xhr.addEventListener('error', () => {
      reject(new ApiError('Unable to reach the server', { status: 0 }))
    })

    xhr.addEventListener('abort', () => {
      reject(new ApiError('Upload cancelled', { status: 0 }))
    })

    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        return
      }

      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.send(formData)
  })
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    request(path, { ...options, method: 'POST', body }),
  postKeepalive: async (path, body) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
      keepalive: true,
    })

    if (!response.ok) {
      console.warn(`Keepalive request failed: ${response.status}`)
    }

    return response
  },
  patchKeepalive: async (path, body) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
      keepalive: true,
    })

    if (!response.ok) {
      console.warn(`Keepalive request failed: ${response.status}`)
    }

    return response
  },
  patch: (path, body, options) =>
    request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  upload,
}
