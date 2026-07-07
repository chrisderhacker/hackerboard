import { useState, useEffect } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import CommandBar from './components/CommandBar'
import CardGrid from './components/CardGrid'
import Inspector from './components/Inspector'

interface Card {
  id: string
  title: string
  description?: string
  thumbnail?: string
  status: string
  nextStep?: string
  dueDate?: string
  section: string
  tags: string[]
  files?: any[]
  links?: any[]
  notes?: any[]
  checklist?: any[]
  activities?: any[]
}

function App() {
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [activeSection, setActiveSection] = useState('inbox')
  const [loading, setLoading] = useState(true)
  const [showCommandBar, setShowCommandBar] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandBar(!showCommandBar)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCommandBar])

  useEffect(() => {
    fetchCards()
  }, [activeSection])

  const fetchCards = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cards`)
      const data = await response.json()
      const filtered = data.filter((card: Card) => card.section === activeSection)
      setCards(filtered)
    } catch (error) {
      console.error('Failed to fetch cards:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      {showCommandBar && (
        <CommandBar
          onClose={() => setShowCommandBar(false)}
          onSelect={(section) => {
            setActiveSection(section)
            setShowCommandBar(false)
          }}
        />
      )}

      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="main-content">
        <div className="cards-container">
          <div className="section-header">
            <h1>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
            <div className="filters">
              <button className="filter-chip">All</button>
              <button className="filter-chip">Pinned</button>
              <button className="filter-chip">Due Soon</button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <CardGrid
              cards={cards}
              onSelectCard={setSelectedCard}
              selectedCardId={selectedCard?.id}
            />
          )}
        </div>

        {selectedCard && (
          <Inspector
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onUpdate={(updated) => {
              setSelectedCard(updated)
              fetchCards()
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
