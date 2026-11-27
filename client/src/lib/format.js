export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '—'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** exponent
  const decimals = value >= 10 || exponent === 0 ? 0 : 1

  return `${value.toFixed(decimals)} ${units[exponent]}`
}

export function formatDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function formatReadingTime(seconds) {
  const totalMinutes = Math.max(0, Math.round((Number(seconds) || 0) / 60))

  if (totalMinutes === 0) {
    return '0m'
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (!hours) {
    return `${minutes}m`
  }

  if (!minutes) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}

export function formatDayLabel(date) {
  if (!date) {
    return ''
  }

  const parsed = new Date(`${date}T12:00:00Z`)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(parsed)
}
