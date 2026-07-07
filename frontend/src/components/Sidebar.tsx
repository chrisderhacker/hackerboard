import '../styles/Sidebar.css'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const sections = [
  { id: 'inbox', label: 'Inbox', icon: '📥' },
  { id: 'next-steps', label: "What's Next", icon: '⚡' },
  { id: 'ideas', label: 'Ideas', icon: '💡' },
  { id: 'projects', label: 'Projects', icon: '📊' },
  { id: 'trailers', label: 'Trailers', icon: '🎬' },
  { id: 'events', label: 'Events', icon: '📅' },
  { id: 'clients', label: 'Clients', icon: '👥' },
  { id: 'archive', label: 'Archive', icon: '📦' },
]

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">HackerBoard</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => onSectionChange(section.id)}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-label">{section.label}</span>
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
