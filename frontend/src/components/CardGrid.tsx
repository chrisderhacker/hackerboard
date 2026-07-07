import Card from './Card'
import { UploadIcon } from './Icons'
import '../styles/CardGrid.css'

import type { Card as CardItem } from '../types'

interface CardGridProps {
  cards: CardItem[]
  onSelectCard: (card: CardItem) => void
  onDeleteCard: (card: CardItem) => void
  selectedCardId?: string
}

export default function CardGrid({ cards, onSelectCard, onDeleteCard, selectedCardId }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <UploadIcon size={38} />
        </div>
        <div className="empty-text">Noch keine Cards hier</div>
        <div className="empty-hint">Dateien einfach per Drag & Drop hierher ziehen</div>
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
          onDelete={() => onDeleteCard(card)}
        />
      ))}
    </div>
  )
}
