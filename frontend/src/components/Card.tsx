import { PaperclipIcon, TrashIcon } from './Icons'
import type { Card as CardData } from '../types'
import '../styles/Card.css'

interface CardProps {
  card: CardData
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
}

export default function Card({ card, isSelected, onClick, onDelete }: CardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      inbox: '#ccff00',
      'in-progress': '#ccff00',
      done: '#10b981',
      archived: '#6b7280',
    }
    return colors[status] || '#ccff00'
  }

  const formatDate = (date?: string) => {
    if (!date) return null
    const d = new Date(date)
    return d.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className={`card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <span className="card-halo" aria-hidden="true" />
      <button
        className="card-delete-btn"
        title="Card löschen"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <TrashIcon size={14} />
      </button>

      {card.thumbnail && (
        <div className="card-thumbnail">
          <img
            src={card.thumbnail}
            alt={card.title}
            onError={(e) => {
              const wrapper = e.currentTarget.parentElement
              if (wrapper) wrapper.style.display = 'none'
            }}
          />
        </div>
      )}

      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{card.title}</h3>
          <div className="card-meta">
            {card.dueDate && (
              <span className="card-due-date">{formatDate(card.dueDate)}</span>
            )}
            {card.files && card.files.length > 0 && (
              <span className="card-file-count">
                <PaperclipIcon size={12} /> {card.files.length}
              </span>
            )}
          </div>
        </div>

        {card.description && (
          <p className="card-description">{card.description.substring(0, 80)}...</p>
        )}

        {card.nextStep && (
          <div className="card-next-step">
            <span className="next-step-label">Next:</span>
            <span className="next-step-text">{card.nextStep}</span>
          </div>
        )}

        <div className="card-footer">
          <span
            className="card-status"
            style={{ borderColor: getStatusColor(card.status) }}
          >
            {card.status}
          </span>

          {card.tags.length > 0 && (
            <div className="card-tags">
              {card.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
              {card.tags.length > 2 && (
                <span className="tag-more">+{card.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
