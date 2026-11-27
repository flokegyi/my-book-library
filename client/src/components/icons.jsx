function Svg({ children, className = 'h-5 w-5', ...props }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export function PlusIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function SearchIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Svg>
  )
}

export function GridIcon(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </Svg>
  )
}

export function ListIcon(props) {
  return (
    <Svg {...props}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </Svg>
  )
}

export function PinIcon({ filled = false, ...props }) {
  return (
    <Svg {...props}>
      <path
        d="M9 4h6l-1 5 3 3v1H7v-1l3-3-1-5Z"
        fill={filled ? 'currentColor' : 'none'}
      />
      <path d="M12 13v7" />
    </Svg>
  )
}

export function PencilIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </Svg>
  )
}

export function TrashIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.5 7 7 19a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 19l.5-12" />
      <path d="M10 11v5M14 11v5" />
    </Svg>
  )
}

export function CloseIcon(props) {
  return (
    <Svg {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  )
}

export function UploadIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </Svg>
  )
}

export function TagIcon(props) {
  return (
    <Svg {...props}>
      <path d="M20.6 13.6 13.6 20.6a2 2 0 0 1-2.8 0l-7.4-7.4V4h9.2l8 8a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </Svg>
  )
}

export function BookIcon(props) {
  return (
    <Svg {...props}>
      <path d="M2.5 5.5A10.5 10.5 0 0 1 12 9v11a10.5 10.5 0 0 0-9.5-3.5v-11Z" />
      <path d="M21.5 5.5A10.5 10.5 0 0 0 12 9v11a10.5 10.5 0 0 1 9.5-3.5v-11Z" />
    </Svg>
  )
}

export function ChevronDownIcon(props) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  )
}

export function CheckIcon(props) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Svg>
  )
}

export function RefreshIcon(props) {
  return (
    <Svg {...props}>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </Svg>
  )
}

export function ChevronLeftIcon(props) {
  return (
    <Svg {...props}>
      <path d="m14.5 6-6 6 6 6" />
    </Svg>
  )
}

export function ChevronRightIcon(props) {
  return (
    <Svg {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Svg>
  )
}

export function ZoomInIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5M10.5 7.5v6M7.5 10.5h6" />
    </Svg>
  )
}

export function ZoomOutIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5M7.5 10.5h6" />
    </Svg>
  )
}

export function FitWidthIcon(props) {
  return (
    <Svg {...props}>
      <path d="M8 4v16M16 4v16" />
      <path d="m4.5 8-2.5 4 2.5 4M19.5 8 22 12l-2.5 4" />
    </Svg>
  )
}

export function FullscreenIcon(props) {
  return (
    <Svg {...props}>
      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
    </Svg>
  )
}

export function ExitFullscreenIcon(props) {
  return (
    <Svg {...props}>
      <path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" />
    </Svg>
  )
}

export function KeyboardIcon(props) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8" />
    </Svg>
  )
}

export function DashboardIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </Svg>
  )
}

export function BookmarkIcon({ filled = false, ...props }) {
  return (
    <Svg {...props}>
      <path
        d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.5L5 21V4.5a1 1 0 0 1 1-1Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </Svg>
  )
}

export function ClockIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  )
}

export function FlameIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 21c3.9 0 6.5-2.6 6.5-6.1 0-2.4-1.3-4.2-2.6-5.6-.4 1.5-1.3 2.4-2.3 2.8.4-3.3-1.2-6.4-4.1-8.1.3 3-1 4.7-2.3 6.2-1 1.1-1.7 2.3-1.7 4.7C5.5 18.4 8.1 21 12 21Z" />
      <path d="M12 21c1.8 0 3-1.2 3-2.9 0-1.5-.9-2.4-1.6-3.2-.2.9-.8 1.4-1.4 1.6-.1-1.5-.9-2.6-2-3.4.1 2.1-.7 3-1.4 4-.2.3-.3.7-.3 1.1 0 1.7 1.4 2.8 3.7 2.8Z" />
    </Svg>
  )
}

export function ArrowRightIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </Svg>
  )
}
