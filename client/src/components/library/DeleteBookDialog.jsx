import { useDeleteBook } from '../../hooks/useBooks.js'
import { secondaryButtonClassName } from '../../lib/formStyles.js'
import { TrashIcon } from '../icons.jsx'
import Dialog from './Dialog.jsx'

export default function DeleteBookDialog({ open, book, onClose }) {
  const deleteBook = useDeleteBook()

  const error =
    deleteBook.error instanceof Error ? deleteBook.error.message : ''

  function handleClose() {
    if (!deleteBook.isPending) {
      deleteBook.reset()
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      dismissible={!deleteBook.isPending}
      size="sm"
      title="Delete book"
      description="This removes the PDF and cover from storage. This cannot be undone."
    >
      {book && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 ring-1 ring-red-200">
              <TrashIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium break-words text-stone-900">
                {book.title}
              </p>
              {book.author && (
                <p className="mt-0.5 text-xs text-stone-500">{book.author}</p>
              )}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={deleteBook.isPending}
              className={secondaryButtonClassName}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                deleteBook.mutate(book.id, {
                  onSuccess: () => {
                    onClose()
                  },
                })
              }
              disabled={deleteBook.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleteBook.isPending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {deleteBook.isPending ? 'Deleting…' : 'Delete book'}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
