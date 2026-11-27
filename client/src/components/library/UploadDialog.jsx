import { useEffect, useRef, useState } from 'react'
import { useUploadBook } from '../../hooks/useBooks.js'
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from '../../lib/formStyles.js'
import { formatFileSize } from '../../lib/format.js'
import { BOOK_STATUSES } from '../../lib/bookOptions.js'
import {
  CloseIcon,
  UploadIcon,
} from '../icons.jsx'
import Dialog from './Dialog.jsx'
import TagPicker from './TagPicker.jsx'

const MAX_FILE_MB = 50
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

const initialForm = {
  title: '',
  author: '',
  description: '',
  status: 'UNREAD',
  tagIds: [],
}

export default function UploadDialog({ open, onClose, tags, onUploaded }) {
  const upload = useUploadBook()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [fileError, setFileError] = useState('')
  const [formError, setFormError] = useState('')
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (open) {
      setFile(null)
      setForm(initialForm)
      setFileError('')
      setFormError('')
      setProgress(0)
      setDragging(false)
      upload.reset()

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function chooseFile(nextFile) {
    setFileError('')
    setFormError('')
    setProgress(0)
    upload.reset()

    if (!nextFile) {
      return
    }

    if (nextFile.size > MAX_FILE_BYTES) {
      setFile(null)
      setFileError(`PDF must be ${MAX_FILE_MB} MB or smaller.`)
      return
    }

    if (
      nextFile.type !== 'application/pdf' &&
      !/\.pdf$/i.test(nextFile.name)
    ) {
      setFile(null)
      setFileError('Only PDF files are supported.')
      return
    }

    try {
      const header = await nextFile.slice(0, 1024).text()

      if (!header.includes('%PDF-')) {
        setFile(null)
        setFileError('This file is not a valid PDF.')
        return
      }
    } catch {
      setFile(null)
      setFileError('This file could not be read. Try another PDF.')
      return
    }

    setFile(nextFile)
  }

  function updateField(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
      setFormError('')
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    chooseFile(event.dataTransfer.files?.[0])
  }

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!file) {
      setFileError('Choose a PDF file to upload.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    const title = form.title.trim()
    const author = form.author.trim()
    const description = form.description.trim()

    if (title) formData.append('title', title)
    if (author) formData.append('author', author)
    if (description) formData.append('description', description)
    formData.append('status', form.status)
    formData.append('tagIds', JSON.stringify(form.tagIds))

    upload.mutate(
      { formData, onProgress: setProgress },
      {
        onSuccess: () => {
          onClose()
          onUploaded?.()
        },
      },
    )
  }

  const error =
    formError || (upload.error instanceof Error ? upload.error.message : '')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!upload.isPending}
      size="lg"
      title="Add a book"
      description="Upload a PDF. We will extract the title, page count, and cover automatically."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <span className={labelClassName}>PDF file</span>

          {file ? (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-stone-200">
                <UploadIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-stone-900">
                  {file.name}
                </span>
                <span className="block text-xs text-stone-500">
                  {formatFileSize(file.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setProgress(0)
                  upload.reset()

                  if (inputRef.current) {
                    inputRef.current.value = ''
                  }
                }}
                disabled={upload.isPending}
                aria-label="Remove selected file"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700 disabled:opacity-50"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 ${
                dragging
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-stone-300 bg-stone-50/60 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-600 shadow-sm ring-1 ring-stone-200">
                <UploadIcon className="h-5 w-5" />
              </span>
              <span className="mt-3 text-sm font-medium text-stone-900">
                Drop a PDF here or browse
              </span>
              <span className="mt-1 text-xs text-stone-500">
                PDF only · up to {MAX_FILE_MB} MB
              </span>
            </label>
          )}

          {fileError && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              {fileError}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="upload-title" className={labelClassName}>
              Title
            </label>
            <input
              id="upload-title"
              name="title"
              type="text"
              maxLength={300}
              value={form.title}
              onChange={updateField('title')}
              placeholder="From PDF metadata"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="upload-author" className={labelClassName}>
              Author
            </label>
            <input
              id="upload-author"
              name="author"
              type="text"
              maxLength={200}
              value={form.author}
              onChange={updateField('author')}
              placeholder="From PDF metadata"
              className={inputClassName}
            />
          </div>
        </div>

        <p className="-mt-2 text-xs text-stone-400">
          Leave title and author blank to use the PDF metadata or file name.
        </p>

        <div>
          <label htmlFor="upload-description" className={labelClassName}>
            Description <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <textarea
            id="upload-description"
            name="description"
            rows={3}
            maxLength={5000}
            value={form.description}
            onChange={updateField('description')}
            placeholder="A short note about this book"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="upload-status" className={labelClassName}>
            Reading status
          </label>
          <select
            id="upload-status"
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
            emptyHint="Create categories from the Tags page to organize books."
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

        {upload.isPending && (
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>
                {progress >= 100
                  ? 'Processing PDF and generating cover…'
                  : 'Uploading…'}
              </span>
              <span>{progress >= 100 ? 'Almost done' : `${progress}%`}</span>
            </div>
            <div
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200"
            >
              <div
                className={`h-full rounded-full bg-emerald-500 transition-all duration-300 ${
                  progress >= 100 ? 'animate-pulse' : ''
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={upload.isPending}
            className={secondaryButtonClassName}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={upload.isPending}
            className={primaryButtonClassName}
          >
            {upload.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Uploading…
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4" />
                Upload book
              </>
            )}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
