import { useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateTag,
} from '../hooks/useTags.js'
import { CATEGORY_COLORS } from '../lib/bookOptions.js'
import { pluralize } from '../lib/format.js'
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../lib/formStyles.js'
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
} from '../components/icons.jsx'

function ColorPicker({ value, onChange, label = 'Tag color' }) {
  const optionRefs = useRef([])

  function handleKeyDown(event, index) {
    let nextIndex = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % CATEGORY_COLORS.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex =
        (index - 1 + CATEGORY_COLORS.length) % CATEGORY_COLORS.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = CATEGORY_COLORS.length - 1
    }

    if (nextIndex === null) {
      return
    }

    event.preventDefault()
    optionRefs.current[nextIndex]?.focus()
    onChange(CATEGORY_COLORS[nextIndex])
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((color, index) => {
        const selected = value.toLowerCase() === color.toLowerCase()

        return (
          <button
            key={color}
            ref={(element) => {
              optionRefs.current[index] = element
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Use color ${color}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(color)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              selected ? 'ring-2 ring-stone-900' : 'ring-1 ring-stone-200'
            }`}
            style={{ backgroundColor: color }}
          >
            {selected && <CheckIcon className="h-4 w-4 text-white" />}
          </button>
        )
      })}
    </div>
  )
}

export default function TagsPage() {
  const tagsQuery = useTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()

  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [createError, setCreateError] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(CATEGORY_COLORS[0])
  const [confirmingId, setConfirmingId] = useState(null)
  const [actionError, setActionError] = useState('')

  const tags = tagsQuery.data ?? []

  function handleCreate(event) {
    event.preventDefault()
    setCreateError('')

    if (!name.trim()) {
      setCreateError('Category name is required.')
      return
    }

    createTag.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName('')
          setColor(CATEGORY_COLORS[0])
        },
      },
    )
  }

  function startEditing(tag) {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color || CATEGORY_COLORS[0])
    setConfirmingId(null)
    setActionError('')
    updateTag.reset()
    deleteTag.reset()
  }

  function handleUpdate(event, tagId) {
    event.preventDefault()
    setActionError('')

    if (!editName.trim()) {
      setActionError('Category name is required.')
      return
    }

    updateTag.mutate(
      { id: tagId, name: editName.trim(), color: editColor },
      {
        onSuccess: () => {
          setEditingId(null)
        },
        onError: (error) => {
          setActionError(
            error instanceof Error ? error.message : 'Unable to update category.',
          )
        },
      },
    )
  }

  function handleDelete(tagId) {
    setActionError('')

    deleteTag.mutate(tagId, {
      onSuccess: () => {
        setConfirmingId(null)

        if (editingId === tagId) {
          setEditingId(null)
        }
      },
      onError: (error) => {
        setActionError(
          error instanceof Error ? error.message : 'Unable to delete category.',
        )
      },
    })
  }

  const createErrorMessage =
    createError ||
    (createTag.error instanceof Error ? createTag.error.message : '')

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            Organize
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Categories
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            Group books by shelf, topic, or mood. Categories can be changed on
            any book.
          </p>
        </div>

        <Link
          to="/"
          className="text-sm font-medium text-stone-600 transition hover:text-stone-950"
        >
          Back to library
        </Link>
      </header>

      {actionError && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="h-fit rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">
            New category
          </h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            Give it a short name and a color for quick recognition.
          </p>

          <form className="mt-5 space-y-5" onSubmit={handleCreate}>
            <div>
              <label
                htmlFor="category-name"
                className="text-sm font-medium text-stone-800"
              >
                Name
              </label>
              <input
                id="category-name"
                name="name"
                type="text"
                required
                maxLength={40}
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setCreateError('')
                  createTag.reset()
                }}
                placeholder="e.g. Design, Fiction, Research"
                className={inputClassName}
              />
            </div>

            <div>
              <span className="text-sm font-medium text-stone-800">Color</span>
              <div className="mt-2">
                <ColorPicker value={color} onChange={setColor} />
              </div>
            </div>

            {createErrorMessage && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {createErrorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={createTag.isPending}
              className={`${primaryButtonClassName} w-full`}
            >
              {createTag.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              {createTag.isPending ? 'Creating…' : 'Create category'}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-6 py-5">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">
                Your categories
              </h2>
              <p className="mt-0.5 text-xs text-stone-400">
                {tagsQuery.isLoading
                  ? 'Loading…'
                  : pluralize(tags.length, 'category', 'categories')}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-50 text-stone-500 ring-1 ring-stone-200">
              <TagIcon className="h-4 w-4" />
            </span>
          </div>

          {tagsQuery.isLoading ? (
            <div className="space-y-3 px-6 py-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-xl bg-stone-100"
                />
              ))}
            </div>
          ) : tagsQuery.isError ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-stone-600">
                Categories could not be loaded.
              </p>
              <button
                type="button"
                onClick={() => tagsQuery.refetch()}
                className={`${secondaryButtonClassName} mt-4`}
              >
                Try again
              </button>
            </div>
          ) : tags.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-50 text-stone-500 ring-1 ring-stone-200">
                <TagIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-stone-900">
                No categories yet
              </h3>
              <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-stone-500">
                Create your first category with the form on the left.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {tags.map((tag) => {
                const isEditing = editingId === tag.id
                const isConfirming = confirmingId === tag.id

                return (
                  <li key={tag.id} className="px-4 py-3 sm:px-6">
                    {isEditing ? (
                      <form
                        className="space-y-3 py-1"
                        onSubmit={(event) => handleUpdate(event, tag.id)}
                      >
                        <input
                          type="text"
                          aria-label="Category name"
                          required
                          maxLength={40}
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          className="block w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 shadow-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
                        />
                        <ColorPicker
                          value={editColor}
                          onChange={setEditColor}
                          label="Updated tag color"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={updateTag.isPending}
                            className={`${primaryButtonClassName} px-3 py-1.5 text-xs`}
                          >
                            {updateTag.isPending ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={updateTag.isPending}
                            className={`${secondaryButtonClassName} px-3 py-1.5 text-xs`}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : isConfirming ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
                        <p className="text-sm text-stone-600">
                          Delete <span className="font-medium text-stone-900">{tag.name}</span>?
                          Books will stay in your library.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(tag.id)}
                            disabled={deleteTag.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            {deleteTag.isPending && (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            )}
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            disabled={deleteTag.isPending}
                            className={`${secondaryButtonClassName} px-3 py-1.5 text-xs`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white ring-offset-1 ring-offset-stone-200"
                          style={{ backgroundColor: tag.color || '#a8a29e' }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-stone-900">
                            {tag.name}
                          </p>
                          <p className="text-xs text-stone-400">
                            {pluralize(tag.bookCount, 'book')}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => startEditing(tag)}
                            aria-label={`Rename ${tag.name}`}
                            title="Edit category"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmingId(tag.id)
                              setEditingId(null)
                              setActionError('')
                              deleteTag.reset()
                            }}
                            aria-label={`Delete ${tag.name}`}
                            title="Delete category"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-6 flex items-center gap-2 px-1 text-xs text-stone-400">
        <TagIcon className="h-3.5 w-3.5" />
        Deleting a category never deletes the books inside it.
      </p>
    </div>
  )
}
