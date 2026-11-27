export const BOOK_STATUSES = [
  {
    value: 'UNREAD',
    label: 'Unread',
    badgeClass: 'bg-stone-100 text-stone-600 ring-stone-200',
    dotClass: 'bg-stone-400',
  },
  {
    value: 'READING',
    label: 'Reading',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    badgeClass: 'bg-sky-50 text-sky-700 ring-sky-200',
    dotClass: 'bg-sky-500',
  },
]

export function getStatusMeta(status) {
  return (
    BOOK_STATUSES.find((item) => item.value === status) ?? BOOK_STATUSES[0]
  )
}

export const CATEGORY_COLORS = [
  '#059669',
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#64748b',
]
