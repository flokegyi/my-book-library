import { useEffect, useId, useRef } from 'react'
import { CloseIcon } from '../icons.jsx'

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  dismissible = true,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const dismissibleRef = useRef(dismissible)
  onCloseRef.current = onClose
  dismissibleRef.current = dismissible

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previouslyFocused = document.activeElement
    const dialog = dialogRef.current
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusable = Array.from(
      dialog?.querySelectorAll(focusableSelector) ?? [],
    ).filter((element) => element.offsetParent !== null)

    ;(focusable[0] ?? dialog)?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape' && dismissibleRef.current) {
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialog) {
        return
      }

      const items = Array.from(
        dialog.querySelectorAll(focusableSelector),
      ).filter((element) => element.offsetParent !== null)

      if (items.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) {
    return null
  }

  const maxWidth =
    size === 'lg' ? 'sm:max-w-2xl' : size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-lg'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:rounded-3xl ${maxWidth}`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-100 bg-white/95 px-6 pt-5 pb-4 backdrop-blur">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-stone-950"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-6 text-stone-500"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Close dialog"
            className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
