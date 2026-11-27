import { CloseIcon } from '../icons.jsx'

const shortcuts = [
  ['← / Page Up', 'Previous page'],
  ['→ / Page Down / Space', 'Next page'],
  ['Shift + Space', 'Previous page'],
  ['Home / End', 'First / last page'],
  ['+ / -', 'Zoom in / out'],
  ['0', 'Fit to width'],
  ['/', 'Jump to page'],
  ['B', 'Bookmark this page'],
  ['F', 'Toggle fullscreen'],
  ['?', 'Show shortcuts'],
  ['Esc', 'Exit fullscreen / close reader'],
]

export default function ReaderShortcuts({ onClose }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-950/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reader-shortcuts-title"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-stone-900 p-5 text-stone-100 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="reader-shortcuts-title" className="text-base font-semibold">
              Keyboard shortcuts
            </h2>
            <p className="mt-1 text-xs text-stone-400">
              Reading controls without leaving the keyboard.
            </p>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close shortcuts"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-5 space-y-2.5">
          {shortcuts.map(([keys, action]) => (
            <div
              key={keys}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <dt className="font-mono text-stone-300">{keys}</dt>
              <dd className="text-right text-stone-400">{action}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
