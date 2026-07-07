import { useState, useEffect, useRef, DragEvent } from 'react'
import { UploadIcon } from './components/Icons'
import type { Card } from './types'
import './App.css'
import Sidebar from './components/Sidebar'
import CommandBar from './components/CommandBar'
import CardGrid from './components/CardGrid'
import Inspector from './components/Inspector'

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
  const [isDragging, setIsDragging] = useState(false)
  const dragDepth = useRef(0)

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

  const createCardsFromFiles = async (files: FileList) => {
    const newCards: Card[] = []
    for (const file of Array.from(files)) {
      const title = file.name.replace(/\.[^.]+$/, '')
      const isImage = file.type.startsWith('image/')
      let created: Card | null = null
      try {
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, section: activeSection, status: 'inbox', tags: [] }),
        })
        if (!response.ok) throw new Error(`API ${response.status}`)
        created = await response.json()
      } catch {
        created = {
          id: `local-${crypto.randomUUID()}`,
          title,
          status: 'inbox',
          section: activeSection,
          tags: [],
          thumbnail: isImage ? URL.createObjectURL(file) : undefined,
          files: [{ id: `local-file-${file.name}`, name: file.name }],
        }
      }
      if (created) newCards.push(created)
    }
    if (newCards.length) setCards((prev) => [...newCards, ...prev])
  }

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    if (!e.dataTransfer.types.includes('Files')) return
    dragDepth.current++
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    dragDepth.current = 0
    setIsDragging(false)
    if (e.dataTransfer.files.length) {
      createCardsFromFiles(e.dataTransfer.files)
    }
  }

  return (
    <div
      className="app"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-zone">
            <UploadIcon size={40} />
            <div className="drop-title">Drop it like it's hot</div>
            <div className="drop-hint">
              Dateien ablegen — landen in „{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}"
            </div>
          </div>
        </div>
      )}

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
