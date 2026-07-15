import { useState } from 'react'
import {
  InboxIcon,
  ZapIcon,
  CalendarIcon,
  ArchiveIcon,
  BoltLogo,
} from './Icons'
import '../styles/Sidebar.css'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onCreateCard: () => void
  collapsed: boolean
  onToggle: () => void
}

export const sections = [
  { id: 'daily-spark', label: 'Übersicht', Icon: BoltLogo },
  { id: 'wien-live', label: 'Wien Live', Icon: ZapIcon },
  { id: 'inbox', label: 'Inbox', Icon: InboxIcon },
  { id: 'events', label: 'Events', Icon: CalendarIcon },
  { id: 'archive', label: 'Archive', Icon: ArchiveIcon },
]

export default function Sidebar({ activeSection, onSectionChange, onCreateCard, collapsed, onToggle }: SidebarProps) {
  const [pinged, setPinged] = useState<string | null>(null)

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <BoltLogo size={20} className="logo-icon" />
          <span className="logo-text">HackerBoard</span>
        </div>
        <button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? 'Menü ausklappen' : 'Menü einklappen'} title={collapsed ? 'Menü ausklappen' : 'Menü einklappen'}>
          <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <button className="sidebar-create" onClick={onCreateCard} aria-label="Idee parken" title="Idee parken"><span>＋</span><b>Idee parken</b></button>
        {sections.map(({ id, label, Icon }) => (
          <button
            key={id}
            aria-label={label}
            title={label}
            className={`nav-item ${activeSection === id ? 'active' : ''} ${pinged === id ? 'pinging' : ''}`}
            onClick={() => {
              setPinged(id)
              onSectionChange(id)
            }}
          >
            <span
              className="nav-icon"
              onAnimationEnd={() => setPinged((cur) => (cur === id ? null : cur))}
            >
              <Icon size={17} />
            </span>
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="profile-btn">
          <span className="avatar">D</span>
          <span className="status">Online</span>
        </button>
      </div>
    </aside>
  )
}
