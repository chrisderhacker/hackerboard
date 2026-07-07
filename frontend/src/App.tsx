import { useState, useEffect, useRef, DragEvent } from 'react'
import { UploadIcon } from './components/Icons'
import type { Card } from './types'
import './App.css'
import Sidebar from './components/Sidebar'
import CommandBar from './components/CommandBar'
import CardGrid from './components/CardGrid'
import Inspector from './components/Inspector'

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
      console.warn('API not reachable:', error)
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  const createCardsFromFiles = async (files: FileList) => {
    const newCards: Card[] = []
    for (const file of Array.from(files)) {
      const title = file.name.replace(/\.[^.]+$/, '')
      try {
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, section: activeSection, status: 'inbox', tags: [] }),
        })
        if (!response.ok) throw new Error(`API ${response.status}`)
        let created: Card = await response.json()

        const formData = new FormData()
        formData.append('file', file)
        const uploadResponse = await fetch(`/api/cards/${created.id}/files`, {
          method: 'POST',
          body: formData,
        })
        if (uploadResponse.ok) created = await uploadResponse.json()

        newCards.push(created)
      } catch (error) {
        console.error('Upload fehlgeschlagen:', file.name, error)
      }
    }
    if (newCards.length) setCards((prev) => [...newCards, ...prev])
  }

  const deleteCard = async (card: Card) => {
    if (!window.confirm(`„${card.title}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) {
      return
    }
    try {
      const response = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`API ${response.status}`)
      if (selectedCard?.id === card.id) setSelectedCard(null)
      setCards((prev) => prev.filter((c) => c.id !== card.id))
    } catch (error) {
      console.error('Löschen fehlgeschlagen:', error)
    }
  }

  const createEmptyCard = async () => {
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Neue Card', section: activeSection, status: 'inbox', tags: [] }),
      })
      if (!response.ok) throw new Error(`API ${response.status}`)
      const created: Card = await response.json()
      setCards((prev) => [created, ...prev])
      setSelectedCard(created)
    } catch (error) {
      console.error('Card konnte nicht erstellt werden:', error)
    }
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
              <button className="new-card-btn" onClick={createEmptyCard}>
                + Neue Card
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <CardGrid
              cards={cards}
              onSelectCard={setSelectedCard}
              onDeleteCard={deleteCard}
              selectedCardId={selectedCard?.id}
            />
          )}
        </div>

        {selectedCard && (
          <Inspector
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onUpdate={(updated) => {
              if (updated.section !== activeSection) {
                setSelectedCard(null)
              } else {
                setSelectedCard(updated)
              }
              fetchCards()
            }}
            onDelete={() => {
              setSelectedCard(null)
              fetchCards()
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
