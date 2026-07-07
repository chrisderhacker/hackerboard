import Card from './Card'
import '../styles/CardGrid.css'

interface CardItem {
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

interface CardGridProps {
  cards: CardItem[]
  onSelectCard: (card: CardItem) => void
  selectedCardId?: string
}

export default function CardGrid({ cards, onSelectCard, selectedCardId }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <div className="empty-text">No cards yet</div>
        <div className="empty-hint">Create your first card with Cmd+N</div>
      </div>
    )
  }

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          isSelected={card.id === selectedCardId}
          onClick={() => onSelectCard(card)}
        />
      ))}
    </div>
  )
}
