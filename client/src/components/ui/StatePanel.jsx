export default function StatePanel({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  compact = false,
}) {
  const isError = tone === 'error'

  return (
    <section
      className={`rounded-3xl border bg-white text-center shadow-sm ${
        isError ? 'border-red-200' : 'border-stone-200'
      } ${compact ? 'px-5 py-9' : 'px-6 py-14 sm:py-16'}`}
    >
      {Icon && (
        <span
          className={`mx-auto flex items-center justify-center rounded-2xl ring-1 ${
            compact ? 'h-11 w-11' : 'h-14 w-14'
          } ${
            isError
              ? 'bg-red-50 text-red-600 ring-red-200'
              : 'bg-stone-50 text-stone-600 ring-stone-200'
          }`}
        >
          <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
        </span>
      )}

      <h2 className="mt-4 text-base font-semibold text-stone-900">{title}</h2>

      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-stone-500">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </section>
  )
}
