import { useState, useEffect } from 'react'
import '../styles/CommandBar.css'

interface CommandBarProps {
  onClose: () => void
  onSelect: (section: string) => void
}

const commands = [
  { id: 'inbox', label: 'Inbox', icon: '📥' },
  { id: 'next-steps', label: "What's Next", icon: '⚡' },
  { id: 'ideas', label: 'Ideas', icon: '💡' },
  { id: 'projects', label: 'Projects', icon: '📊' },
  { id: 'trailers', label: 'Trailers', icon: '🎬' },
  { id: 'events', label: 'Events', icon: '📅' },
  { id: 'clients', label: 'Clients', icon: '👥' },
  { id: 'archive', label: 'Archive', icon: '📦' },
]

export default function CommandBar({ onClose, onSelect }: CommandBarProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filtered, selectedIndex, onClose, onSelect])

  return (
    <div className="command-bar-overlay" onClick={onClose}>
      <div className="command-bar" onClick={(e) => e.stopPropagation()}>
        <div className="command-bar-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search or jump to..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            autoFocus
            className="command-bar-input"
          />
          <span className="close-hint">ESC</span>
        </div>

        <div className="command-bar-results">
          {filtered.map((cmd, index) => (
            <button
              key={cmd.id}
              className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => onSelect(cmd.id)}
            >
              <span className="command-icon">{cmd.icon}</span>
              <span className="command-label">{cmd.label}</span>
              <span className="command-hint">
                {index === 0 && <span>↵</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
