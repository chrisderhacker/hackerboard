import { useState } from 'react'
import '../styles/Inspector.css'

interface Card {
  id: string
  title: string
  description?: string
  thumbnail?: string
  status: string
  nextStep?: string
  dueDate?: string
  tags: string[]
  files?: any[]
  links?: any[]
  notes?: any[]
  checklist?: any[]
  activities?: any[]
}

interface InspectorProps {
  card: Card
  onClose: () => void
  onUpdate: (card: Card) => void
}

export default function Inspector({ card, onClose, onUpdate }: InspectorProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [nextStep, setNextStep] = useState(card.nextStep || '')
  const [status, setStatus] = useState(card.status)

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          nextStep,
          status,
        }),
      })
      const updated = await response.json()
      onUpdate(updated)
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }

  return (
    <div className="inspector">
      <div className="inspector-header">
        <h2>Details</h2>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="inspector-content">
        {card.thumbnail && (
          <div className="inspector-preview">
            <img src={card.thumbnail} alt={card.title} />
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
            <label>Next Step</label>
            <input
              type="text"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="What's the next action?"
            />
          </div>

          {card.dueDate && (
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={card.dueDate?.split('T')[0] || ''}
                disabled
              />
            </div>
          )}
        </div>

        {card.checklist && card.checklist.length > 0 && (
          <div className="inspector-section">
            <h3>Checklist</h3>
            <div className="checklist">
              {card.checklist.map((item: any) => (
                <div key={item.id} className="checklist-item">
                  <input
                    type="checkbox"
                    defaultChecked={item.completed}
                    disabled
                  />
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
              {card.files.map((file: any) => (
                <div key={file.id} className="file-item">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {card.activities && card.activities.length > 0 && (
          <div className="inspector-section">
            <h3>Activity</h3>
            <div className="activity-list">
              {card.activities.map((activity: any) => (
                <div key={activity.id} className="activity-item">
                  <span className="activity-time">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </span>
                  <span className="activity-message">{activity.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="inspector-actions">
          <button className="btn-primary" onClick={handleSave}>
            Save Changes
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
