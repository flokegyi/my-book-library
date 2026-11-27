import { ClockIcon, FlameIcon } from '../icons.jsx'
import { formatDayLabel, formatReadingTime, pluralize } from '../../lib/format.js'

export default function ReadingStatsPanel({ daily = [], streakDays = 0, todaySeconds = 0 }) {
  const hasActivity = daily.some((day) => day.seconds > 0)
  const maxSeconds = Math.max(60, ...daily.map((day) => day.seconds))
  const weekSeconds = daily.reduce((total, day) => total + day.seconds, 0)
  const chartLabel = daily
    .map(
      (day) =>
        `${formatDayLabel(day.date)}: ${formatReadingTime(day.seconds)}`,
    )
    .join(', ')

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-stone-950">
            Daily reading
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            {hasActivity
              ? `${formatReadingTime(weekSeconds)} over the last ${pluralize(daily.length, 'day')}`
              : 'Your activity will appear after your first reading session.'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
              <FlameIcon className="h-3.5 w-3.5 text-orange-500" />
              Streak
            </p>
            <p className="mt-0.5 text-sm font-semibold text-stone-900">
              {pluralize(streakDays, 'day')}
            </p>
          </div>
          <div className="h-9 w-px bg-stone-200" />
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-xs font-medium text-stone-500">
              <ClockIcon className="h-3.5 w-3.5 text-emerald-600" />
              Today
            </p>
            <p className="mt-0.5 text-sm font-semibold text-stone-900">
              {formatReadingTime(todaySeconds)}
            </p>
          </div>
        </div>
      </div>

      {daily.length > 0 && (
        <div
          role="img"
          aria-label={`Reading time by day. ${chartLabel}`}
          className="mt-6 grid grid-cols-7 gap-2 sm:gap-3"
        >
          {daily.map((day) => {
            const label = formatDayLabel(day.date)
            const height = Math.max(
              day.seconds > 0 ? 10 : 4,
              Math.round((day.seconds / maxSeconds) * 100),
            )

            return (
              <div key={day.date} className="min-w-0 text-center" title={`${label}: ${formatReadingTime(day.seconds)}`}>
                <div className="flex h-24 items-end justify-center sm:h-28">
                  <div
                    className={`w-full max-w-9 rounded-t-lg transition-[height] duration-300 ${
                      day.seconds > 0 ? 'bg-emerald-500' : 'bg-stone-200'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <p className="mt-2 truncate text-[10px] font-medium text-stone-500">
                  {label}
                </p>
                <p className="text-[10px] tabular-nums text-stone-400">
                  {day.minutes > 0 ? `${day.minutes}m` : '—'}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
