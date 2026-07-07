import '../styles/Card.css'

interface CardProps {
  card: {
    id: string
    title: string
    description?: string
    thumbnail?: string
    status: string
    nextStep?: string
    dueDate?: string
    tags: string[]
    files?: any[]
  }
  isSelected: boolean
  onClick: () => void
}

export default function Card({ card, isSelected, onClick }: CardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      inbox: '#bfff00',
      'in-progress': '#3b82f6',
      done: '#10b981',
      archived: '#6b7280',
    }
    return colors[status] || '#bfff00'
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
      {card.thumbnail && (
        <div className="card-thumbnail">
          <img src={card.thumbnail} alt={card.title} />
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
              <span className="card-file-count">📎 {card.files.length}</span>
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
