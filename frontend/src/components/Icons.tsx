import { useId, ReactNode } from 'react'

interface IconProps {
  size?: number
  className?: string
}

/* Streamline-style gradient stroke icons — lime → ice blue */
function GradientIcon({ size = 18, className, children }: IconProps & { children: (gid: string) => ReactNode }) {
  const gid = useId()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c6ff4a" />
          <stop offset="100%" stopColor="#4ac2ff" />
        </linearGradient>
      </defs>
      {children(gid)}
    </svg>
  )
}

const strokeProps = (gid: string) => ({
  stroke: `url(#${gid})`,
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function InboxIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <>
          <path d="M3 13.5 5.2 5.8A1.8 1.8 0 0 1 6.9 4.5h10.2a1.8 1.8 0 0 1 1.7 1.3L21 13.5" {...strokeProps(g)} />
          <path d="M3 13.5h5l1.2 2.3h5.6l1.2-2.3h5v4.2a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 17.7v-4.2Z" {...strokeProps(g)} />
        </>
      )}
    </GradientIcon>
  )
}

export function ZapIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => <path d="M13.2 2.5 5 13.4h5.4L10.8 21.5 19 10.6h-5.4l-.4-8.1Z" {...strokeProps(g)} />}
    </GradientIcon>
  )
}

export function BulbIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <>
          <path d="M12 3a6.5 6.5 0 0 0-3.9 11.7c.8.6 1.4 1.5 1.4 2.5v.3h5v-.3c0-1 .6-1.9 1.4-2.5A6.5 6.5 0 0 0 12 3Z" {...strokeProps(g)} />
          <path d="M10 20.5h4" {...strokeProps(g)} />
        </>
      )}
    </GradientIcon>
  )
}

export function FolderIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2.5h8.4A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z" {...strokeProps(g)} />
      )}
    </GradientIcon>
  )
}

export function FilmIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <>
          <rect x="3" y="4.5" width="18" height="15" rx="1.8" {...strokeProps(g)} />
          <path d="M7.5 4.5v15M16.5 4.5v15M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21" {...strokeProps(g)} />
        </>
      )}
    </GradientIcon>
  )
}

export function CalendarIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="1.8" {...strokeProps(g)} />
          <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" {...strokeProps(g)} />
          <path d="M8 13.5h2.5M13.5 13.5H16M8 16.8h2.5" {...strokeProps(g)} />
        </>
      )}
    </GradientIcon>
  )
}

export function UsersIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <>
          <circle cx="9" cy="8.5" r="3.2" {...strokeProps(g)} />
          <path d="M3.5 19.5c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" {...strokeProps(g)} />
          <path d="M15.5 5.8a3.2 3.2 0 0 1 0 5.4M17.8 15.1c1.5.7 2.4 2.2 2.7 4.4" {...strokeProps(g)} />
        </>
      )}
    </GradientIcon>
  )
}

export function ArchiveIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <>
          <rect x="3" y="4" width="18" height="4.5" rx="1" {...strokeProps(g)} />
          <path d="M4.5 8.5v9.7A1.8 1.8 0 0 0 6.3 20h11.4a1.8 1.8 0 0 0 1.8-1.8V8.5" {...strokeProps(g)} />
          <path d="M9.5 12.5h5" {...strokeProps(g)} />
        </>
      )}
    </GradientIcon>
  )
}

export function SearchIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" {...strokeProps(g)} />
          <path d="m15.5 15.5 5 5" {...strokeProps(g)} />
        </>
      )}
    </GradientIcon>
  )
}

export function XIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => <path d="m6 6 12 12M18 6 6 18" {...strokeProps(g)} />}
    </GradientIcon>
  )
}

export function PaperclipIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <path
          d="m20 11.5-7.8 7.8a5 5 0 0 1-7-7l7.7-7.8a3.3 3.3 0 0 1 4.7 4.7l-7.7 7.7a1.7 1.7 0 0 1-2.4-2.4l7.2-7.1"
          {...strokeProps(g)}
        />
      )}
    </GradientIcon>
  )
}

export function FileIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <>
          <path d="M6 3.5h8l4 4v11.2a1.8 1.8 0 0 1-1.8 1.8H6a1.8 1.8 0 0 1-1.8-1.8V5.3A1.8 1.8 0 0 1 6 3.5Z" {...strokeProps(g)} />
          <path d="M13.5 3.5v4.5H18" {...strokeProps(g)} />
        </>
      )}
    </GradientIcon>
  )
}

export function UploadIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <>
          <path d="M12 15.5v-11M7.5 8.5 12 4l4.5 4.5" {...strokeProps(g)} />
          <path d="M4 15.5v2.7A1.8 1.8 0 0 0 5.8 20h12.4a1.8 1.8 0 0 0 1.8-1.8v-2.7" {...strokeProps(g)} />
        </>
      )}
    </GradientIcon>
  )
}


export function TrashIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <>
          <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" {...strokeProps(g)} />
          <path d="M6 6.5 6.8 19a1.8 1.8 0 0 0 1.8 1.7h6.8a1.8 1.8 0 0 0 1.8-1.7L18 6.5" {...strokeProps(g)} />
          <path d="M10 10.5v6M14 10.5v6" {...strokeProps(g)} />
        </>
      )}
    </GradientIcon>
  )
}

export function ExpandIcon(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <path d="M14.5 4H20v5.5M9.5 20H4v-5.5M20 4l-6.8 6.8M4 20l6.8-6.8" {...strokeProps(g)} />
      )}
    </GradientIcon>
  )
}

export function BoltLogo(p: IconProps) {
  return (
    <GradientIcon {...p}>
      {(g) => (
        <path
          d="M13.2 2.5 5 13.4h5.4L10.8 21.5 19 10.6h-5.4l-.4-8.1Z"
          fill={`url(#${g})`}
          stroke="none"
        />
      )}
    </GradientIcon>
  )
}
