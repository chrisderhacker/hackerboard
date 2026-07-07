import { useEffect, useState } from 'react'
import { FileIcon, XIcon, ExpandIcon } from './Icons'
import { sections } from './Sidebar'
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
  const [status, setStatus] = useState(card.status)
  const [section, setSection] = useState(card.section)
  const [dueDate, setDueDate] = useState(card.dueDate?.split('T')[0] || '')
  const [saving, setSaving] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  // Sync form when a different card is selected
  useEffect(() => {
    setTitle(card.title)
    setDescription(card.description || '')
    setNextStep(card.nextStep || '')
    setStatus(card.status)
    setSection(card.section)
    setDueDate(card.dueDate?.split('T')[0] || '')
  }, [card.id])

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          nextStep,
          status,
          section,
          dueDate: dueDate || null,
        }),
      })
      if (!response.ok) throw new Error(`API ${response.status}`)
      const updated = await response.json()
      onUpdate(updated)
    } catch (error) {
      console.error('Failed to update card:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'archive', status: 'archived' }),
      })
      if (!response.ok) throw new Error(`API ${response.status}`)
      onUpdate(await response.json())
    } catch (error) {
      console.error('Failed to archive card:', error)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`„${card.title}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) {
      return
    }
    try {
      const response = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`API ${response.status}`)
      onDelete()
    } catch (error) {
      console.error('Failed to delete card:', error)
    }
  }

  return (
    <div className="inspector">
      <div className="inspector-header">
        <h2>Details</h2>
        <button className="close-btn" onClick={onClose}>
          <XIcon size={15} />
        </button>
      </div>

      <div className="inspector-content">
        {card.thumbnail && (
          <div className="inspector-preview" onClick={() => setZoomed(true)}>
            <img src={card.thumbnail} alt={card.title} />
            <span className="zoom-hint">
              <ExpandIcon size={12} /> Vergrößern
            </span>
          </div>
        )}

        <div className="inspector-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title..."
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="inbox">Inbox</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label>Section</label>
              <select value={section} onChange={(e) => setSection(e.target.value)}>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Next Step</label>
            <input
              type="text"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="What's the next action?"
            />
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {card.checklist && card.checklist.length > 0 && (
          <div className="inspector-section">
            <h3>Checklist</h3>
            <div className="checklist">
              {card.checklist.map((item) => (
                <div key={item.id} className="checklist-item">
                  <input type="checkbox" defaultChecked={item.completed} disabled />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {card.files && card.files.length > 0 && (
          <div className="inspector-section">
            <h3>Files ({card.files.length})</h3>
            <div className="files-list">
              {card.files.map((file) => (
                <a
                  key={file.id}
                  className="file-item"
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileIcon size={15} className="file-icon" />
                  <span className="file-name">{file.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {card.activities && card.activities.length > 0 && (
          <div className="inspector-section">
            <h3>Activity</h3>
            <div className="activity-list">
              {card.activities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <span className="activity-time">
                    {new Date(activity.createdAt).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="activity-message">{activity.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="inspector-actions">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Speichert…' : 'Speichern'}
          </button>
          <button className="btn-secondary" onClick={handleArchive}>
            Archivieren
          </button>
          <button className="btn-danger" onClick={handleDelete} title="Card löschen">
            Löschen
          </button>
        </div>
      </div>

      {zoomed && card.thumbnail && (
        <Lightbox src={card.thumbnail} alt={card.title} onClose={() => setZoomed(false)} />
      )}
    </div>
  )
}
