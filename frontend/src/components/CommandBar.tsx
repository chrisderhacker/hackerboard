import { useState, useEffect } from 'react'
import { SearchIcon } from './Icons'
import { sections } from './Sidebar'
import '../styles/CommandBar.css'

interface CommandBarProps {
  onClose: () => void
  onSelect: (section: string) => void
}

export default function CommandBar({ onClose, onSelect }: CommandBarProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = sections.filter((cmd) =>
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
          <SearchIcon size={16} className="search-icon" />
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
          {filtered.map(({ id, label, Icon }, index) => (
            <button
              key={id}
              className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => onSelect(id)}
            >
              <span className="command-icon">
                <Icon size={16} />
              </span>
              <span className="command-label">{label}</span>
              <span className="command-hint">{index === selectedIndex && <span>↵</span>}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
