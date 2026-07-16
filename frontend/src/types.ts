export interface CardFile {
  id: string
  name?: string
  url?: string
  type?: string
  size?: number
}

export interface CardLink {
  id: string
  title?: string
  url: string
}

export interface CardNote {
  id: string
  content: string
  createdAt?: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface CardActivity {
  id: string
  type?: string
  message: string
  createdAt: string
}

export interface Card {
  id: string
  title: string
  description?: string
  thumbnail?: string
  status: string
  priority?: 'normal' | 'high' | 'urgent'
  nextStep?: string
  dueDate?: string
  section: string
  tags: string[]
  files?: CardFile[]
  links?: CardLink[]
  notes?: CardNote[]
  checklist?: ChecklistItem[]
  activities?: CardActivity[]
  createdAt?: string
  updatedAt?: string
}
