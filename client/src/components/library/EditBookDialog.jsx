import { useEffect, useState } from 'react'
import { useUpdateBook } from '../../hooks/useBooks.js'
import { BOOK_STATUSES } from '../../lib/bookOptions.js'
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from '../../lib/formStyles.js'
import { formatDate, formatFileSize } from '../../lib/format.js'
import BookCover from './BookCover.jsx'
import Dialog from './Dialog.jsx'
import TagPicker from './TagPicker.jsx'

const emptyForm = {
  title: '',
  author: '',
  description: '',
  status: 'UNREAD',
  tagIds: [],
}

export default function EditBookDialog({ open, book, tags, onClose }) {
  const updateBook = useUpdateBook()
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open && book) {
      setForm({
        title: book.title ?? '',
        author: book.author ?? '',
        description: book.description ?? '',
        status: book.status ?? 'UNREAD',
        tagIds: book.tags.map((tag) => tag.id),
      })
      setFormError('')
      updateBook.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, book])

  function updateField(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
      setFormError('')
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!form.title.trim()) {
      setFormError('Title is required.')
      return
    }

    updateBook.mutate(
      {
        id: book.id,
        title: form.title.trim(),
        author: form.author.trim(),
        description: form.description.trim(),
        status: form.status,
        tagIds: form.tagIds,
      },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  const error =
    formError || (updateBook.error instanceof Error ? updateBook.error.message : '')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!updateBook.isPending}
      size="lg"
      title="Edit book"
      description="Update the details, reading status, or categories for this book."
    >
      {book && (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex items-center gap-4 rounded-2xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200/70">
            <BookCover
              book={book}
              compact
              className="h-20 w-14 shrink-0 rounded-lg shadow-sm ring-1 ring-stone-200"
            />
            <div className="min-w-0 text-xs text-stone-500">
              <p className="text-sm font-medium text-stone-900">
                {book.pageCount
                  ? `${book.pageCount} ${book.pageCount === 1 ? 'page' : 'pages'}`
                  : 'Page count unavailable'}
              </p>
              <p className="mt-1">
                {formatFileSize(book.fileSize)}
                {formatDate(book.createdAt)
                  ? ` · Added ${formatDate(book.createdAt)}`
                  : ''}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="edit-title" className={labelClassName}>
              Title
            </label>
            <input
              id="edit-title"
              name="title"
              type="text"
              required
              maxLength={300}
              value={form.title}
              onChange={updateField('title')}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="edit-author" className={labelClassName}>
              Author
            </label>
            <input
              id="edit-author"
              name="author"
              type="text"
              maxLength={200}
              value={form.author}
              onChange={updateField('author')}
              placeholder="Unknown author"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="edit-description" className={labelClassName}>
              Description{' '}
              <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={4}
              maxLength={5000}
              value={form.description}
              onChange={updateField('description')}
              placeholder="A short note about this book"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="edit-status" className={labelClassName}>
              Reading status
            </label>
            <select
              id="edit-status"
              name="status"
              value={form.status}
              onChange={updateField('status')}
              className={`${selectClassName} mt-2 px-3.5 py-2.5`}
            >
              {BOOK_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className={labelClassName}>Categories</span>
            <TagPicker
              tags={tags}
              selected={form.tagIds}
              onChange={(tagIds) =>
                setForm((current) => ({ ...current, tagIds }))
              }
              emptyHint="No categories yet. Create some on the Tags page."
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={updateBook.isPending}
              className={secondaryButtonClassName}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateBook.isPending}
              className={primaryButtonClassName}
            >
              {updateBook.isPending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {updateBook.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
