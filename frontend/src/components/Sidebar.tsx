import {
  InboxIcon,
  ZapIcon,
  BulbIcon,
  FolderIcon,
  FilmIcon,
  CalendarIcon,
  UsersIcon,
  ArchiveIcon,
  BoltLogo,
} from './Icons'
import '../styles/Sidebar.css'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export const sections = [
  { id: 'inbox', label: 'Inbox', Icon: InboxIcon },
  { id: 'next-steps', label: "What's Next", Icon: ZapIcon },
  { id: 'ideas', label: 'Ideas', Icon: BulbIcon },
  { id: 'projects', label: 'Projects', Icon: FolderIcon },
  { id: 'trailers', label: 'Trailers', Icon: FilmIcon },
  { id: 'events', label: 'Events', Icon: CalendarIcon },
  { id: 'clients', label: 'Clients', Icon: UsersIcon },
  { id: 'archive', label: 'Archive', Icon: ArchiveIcon },
]

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
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
            className={`nav-item ${activeSection === id ? 'active' : ''}`}
            onClick={() => onSectionChange(id)}
          >
            <span className="nav-icon">
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
