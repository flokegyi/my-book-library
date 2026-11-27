import { getStatusMeta } from '../../lib/bookOptions.js'

export default function StatusBadge({ status, className = '' }) {
  const meta = getStatusMeta(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${meta.badgeClass} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  )
}
