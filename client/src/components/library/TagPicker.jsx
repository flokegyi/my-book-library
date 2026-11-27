import { CheckIcon, TagIcon } from '../icons.jsx'

export default function TagPicker({ tags, selected, onChange, emptyHint }) {
  function toggle(tagId) {
    onChange(
      selected.includes(tagId)
        ? selected.filter((id) => id !== tagId)
        : [...selected, tagId],
    )
  }

  if (tags.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-dashed border-stone-300 px-3.5 py-3 text-sm text-stone-500">
        <span className="flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-stone-400" />
          {emptyHint ?? 'No categories yet.'}
        </span>
      </div>
    )
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selected.includes(tag.id)

        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            aria-pressed={isSelected}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              isSelected
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
            }`}
          >
            {isSelected ? (
              <CheckIcon className="h-3.5 w-3.5" />
            ) : (
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color || '#a8a29e' }}
              />
            )}
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}
