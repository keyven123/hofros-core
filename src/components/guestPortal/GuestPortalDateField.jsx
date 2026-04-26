import { useRef } from 'react'
import { ymdToDdMmYyyy } from '../../utils/guestPortalDates'

function CalendarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinejoin="round" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  )
}

const rowClass =
  'relative flex h-11 min-h-11 w-full min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 [color-scheme:light]'

/**
 * Shared date control for direct portal: calendar icon, DD/MM/YYYY, green “Change”, native picker via showPicker.
 * @param {'form'|'hero'} variant — form adds label above; hero is compact for hero banner.
 */
export default function GuestPortalDateField({
  variant = 'form',
  label,
  ariaLabel,
  value,
  minYmd,
  onChange,
  primaryColor,
  className = '',
}) {
  const inputRef = useRef(null)
  const resolvedAria = label || ariaLabel || 'Date'

  function openPicker() {
    const el = inputRef.current
    if (!el) return
    try {
      if (typeof el.showPicker === 'function') {
        el.showPicker()
      } else {
        el.click()
      }
    } catch {
      try {
        el.click()
      } catch {
        /* ignore */
      }
    }
  }

  const row = (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${resolvedAria}, ${ymdToDdMmYyyy(value)}. Press to change date.`}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openPicker()
        }
      }}
      className={`${rowClass} ${className}`.trim()}
    >
      <CalendarIcon className="pointer-events-none h-[1.05rem] w-[1.05rem] shrink-0 text-slate-500" />
      <span className="pointer-events-none min-w-0 flex-1 text-left text-sm font-semibold tabular-nums text-slate-700">
        {ymdToDdMmYyyy(value)}
      </span>
      <span className="pointer-events-none shrink-0 text-[10px] font-bold uppercase" style={{ color: primaryColor }}>
        Change
      </span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={minYmd || undefined}
        onChange={onChange}
        tabIndex={-1}
        className="sr-only"
      />
    </div>
  )

  if (variant === 'hero') {
    return row
  }

  return (
    <div className="block">
      {label ? (
        <span className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">{label}</span>
      ) : null}
      {row}
    </div>
  )
}
