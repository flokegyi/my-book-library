import { useEffect, useState } from 'react'
import { BookIcon } from '../icons.jsx'

const COVER_GRADIENTS = [
  ['#064e3b', '#34d399'],
  ['#1e3a8a', '#60a5fa'],
  ['#4c1d95', '#c4b5fd'],
  ['#78350f', '#fbbf24'],
  ['#7f1d1d', '#fca5a5'],
  ['#134e4a', '#5eead4'],
]

function gradientFor(title) {
  let hash = 0

  for (const char of title || 'Untitled') {
    hash = (hash * 31 + char.charCodeAt(0)) % 997
  }

  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length]
}

function CoverFallback({ book, compact }) {
  const [from, to] = gradientFor(book.title)

  return (
    <div
      className="flex h-full w-full flex-col justify-between p-3 text-white"
      style={{ backgroundImage: `linear-gradient(150deg, ${from}, ${to})` }}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white">
        <BookIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </span>

      {!compact && (
        <span className="min-w-0">
          <span className="line-clamp-3 block text-sm leading-snug font-semibold drop-shadow-sm">
            {book.title}
          </span>
          {book.author && (
            <span className="mt-1 line-clamp-1 block text-[11px] text-white/75">
              {book.author}
            </span>
          )}
        </span>
      )}
    </div>
  )
}

export default function BookCover({
  book,
  className = '',
  imageClassName = '',
  compact = false,
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [book.coverUrl])

  return (
    <div className={`overflow-hidden bg-stone-100 ${className}`}>
      {book.coverUrl && !failed ? (
        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${imageClassName}`}
        />
      ) : (
        <CoverFallback book={book} compact={compact} />
      )}
    </div>
  )
}
