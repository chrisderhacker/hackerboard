import { useState } from 'react'
import {
  InboxIcon,
  CalendarIcon,
  ArchiveIcon,
  BoltLogo,
} from './Icons'
import '../styles/Sidebar.css'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export const sections = [
  { id: 'daily-spark', label: 'Daily Spark', Icon: BoltLogo },
  { id: 'inbox', label: 'Inbox', Icon: InboxIcon },
  { id: 'events', label: 'Events', Icon: CalendarIcon },
  { id: 'archive', label: 'Archive', Icon: ArchiveIcon },
]

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [pinged, setPinged] = useState<string | null>(null)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <BoltLogo size={20} className="logo-icon" />
          <span className="logo-text">HackerBoard</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map(({ id, label, Icon }) => (
          <button
            key={id}
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
