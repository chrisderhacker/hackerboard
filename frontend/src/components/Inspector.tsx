import { useEffect, useState } from 'react'
import { FileIcon, XIcon, ExpandIcon } from './Icons'
import Lightbox from './Lightbox'
import type { Card } from '../types'
import '../styles/Inspector.css'

interface InspectorProps {
  card: Card
  onClose: () => void
  onUpdate: (card: Card) => void
  onDelete: () => void
}

export default function Inspector({ card, onClose, onUpdate, onDelete }: InspectorProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [nextStep, setNextStep] = useState(card.nextStep || '')
  const [dueDate, setDueDate] = useState(card.dueDate?.split('T')[0] || '')
  const [saving, setSaving] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const isArchived = card.section === 'archive' || card.status === 'archived' || card.status === 'done'

  useEffect(() => {
    setTitle(card.title)
    setDescription(card.description || '')
    setNextStep(card.nextStep || '')
    setDueDate(card.dueDate?.split('T')[0] || '')
  }, [card.id])

  const patchCard = async (data: Record<string, unknown>) => {
    const response = await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`API ${response.status}`)
    const updated = await response.json()
    onUpdate(updated)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await patchCard({ title, description, nextStep, dueDate: dueDate || null })
    } catch (error) {
      console.error('Failed to update card:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    try {
      await patchCard({ section: 'archive', status: 'done' })
    } catch (error) {
      console.error('Failed to archive card:', error)
    }
  }

  const handleRestore = async () => {
    try {
      await patchCard({ section: 'inbox', status: 'inbox' })
    } catch (error) {
      console.error('Failed to restore card:', error)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`„${card.title}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return
    try {
      const response = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`API ${response.status}`)
      onDelete()
    } catch (error) {
      console.error('Failed to delete card:', error)
    }
  }

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <span className="inspector-kicker">KARTE</span>
        <button className="close-btn" onClick={onClose} aria-label="Details schließen"><XIcon size={15} /></button>
      </div>

      <div className="inspector-content">
        {card.thumbnail && (
          <button className="inspector-preview" onClick={() => setZoomed(true)}>
            <img src={card.thumbnail} alt={card.title} />
            <span className="zoom-hint"><ExpandIcon size={12} /> Vergrößern</span>
          </button>
        )}

        <div className="inspector-editor">
          <textarea className="inspector-title" value={title} onChange={(event) => setTitle(event.target.value)} rows={2} aria-label="Titel" />
          <textarea className="inspector-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Kurze Notiz …" aria-label="Beschreibung" />
          <div className="inspector-next">
            <span>NÄCHSTER SCHRITT</span>
            <input value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="Was ist der nächste Move?" />
          </div>
        </div>

        <details className="inspector-more">
          <summary>Mehr Details <span>＋</span></summary>
          <div className="compact-field"><label>Fällig</label><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></div>
          <div className="compact-meta"><span>STATUS</span><strong>{card.status}</strong><span>BEREICH</span><strong>{card.section}</strong></div>
          {card.checklist && card.checklist.length > 0 && <div className="compact-list">{card.checklist.map(item => <label key={item.id}><input type="checkbox" checked={item.completed} readOnly /> {item.text}</label>)}</div>}
        </details>

        {card.files && card.files.length > 0 && (
          <details className="inspector-more">
            <summary>Dateien <span>{card.files.length}</span></summary>
            <div className="files-list">{card.files.map(file => <a key={file.id} className="file-item" href={file.url} target="_blank" rel="noreferrer"><FileIcon size={14} /><span className="file-name">{file.name}</span></a>)}</div>
          </details>
        )}

        {card.activities && card.activities.length > 0 && (
          <details className="inspector-more">
            <summary>Verlauf <span>{card.activities.length}</span></summary>
            <div className="activity-list">{card.activities.slice(0, 8).map(activity => <div className="activity-item" key={activity.id}><span>{new Date(activity.createdAt).toLocaleDateString('de-DE')}</span><p>{activity.message}</p></div>)}</div>
          </details>
        )}

        <div className="inspector-actions">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Speichert…' : 'Speichern'}</button>
          {isArchived ? <button className="btn-secondary restore" onClick={handleRestore}>↩ Wiederherstellen</button> : <button className="btn-secondary" onClick={handleArchive}>✓ Erledigt</button>}
          <button className="inspector-delete" onClick={handleDelete}>Löschen</button>
        </div>
      </div>

      {zoomed && card.thumbnail && <Lightbox src={card.thumbnail} alt={card.title} onClose={() => setZoomed(false)} />}
    </aside>
  )
}
