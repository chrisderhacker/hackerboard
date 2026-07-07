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

const DEMO_CARDS: Card[] = [
  {
    id: 'demo-1',
    title: 'Trailer-Konzept "Neon Nights"',
    description: 'Erster Rohschnitt steht. Sounddesign fehlt noch, Farblook geht Richtung Cyberpunk mit warmen Kontrasten.',
    thumbnail: 'https://picsum.photos/seed/neon/400/240',
    status: 'in-progress',
    nextStep: 'Sounddesign-Briefing schreiben',
    dueDate: '2026-07-15',
    section: 'inbox',
    tags: ['trailer', 'cut', 'sound'],
    files: [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }],
  },
  {
    id: 'demo-2',
    title: 'Event-Recap Sommerfest',
    description: 'Footage von 3 Kameras gesichtet. Die Drohnenaufnahmen vom Einlass sind stark.',
    thumbnail: 'https://picsum.photos/seed/event/400/240',
    status: 'inbox',
    nextStep: 'Best-of Selects markieren',
    dueDate: '2026-07-10',
    section: 'inbox',
    tags: ['event', 'recap'],
    files: [{ id: 'f4' }],
  },
  {
    id: 'demo-3',
    title: 'Idee: Vertikale Serie für Clients',
    description: 'Kurzformat 30-60s, ein Take, roher Look. Könnte als Abo-Paket verkauft werden.',
    status: 'inbox',
    nextStep: 'Pilotfolge skizzieren',
    section: 'inbox',
    tags: ['idea', 'social', 'business'],
  },
  {
    id: 'demo-4',
    title: 'Client-Pitch happyendings.at',
    description: 'Moodboard und Referenzen zusammenstellen für das Kennenlern-Meeting.',
    thumbnail: 'https://picsum.photos/seed/pitch/400/240',
    status: 'in-progress',
    nextStep: 'Moodboard finalisieren',
    dueDate: '2026-07-09',
    section: 'inbox',
    tags: ['client', 'pitch'],
    files: [{ id: 'f5' }, { id: 'f6' }],
  },
]

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
      if (!response.ok) throw new Error(`API ${response.status}`)
      const data = await response.json()
      const filtered = data.filter((card: Card) => card.section === activeSection)
      setCards(filtered)
    } catch (error) {
      console.warn('API not reachable, showing demo cards:', error)
      setCards(DEMO_CARDS.filter((card) => card.section === activeSection))
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
