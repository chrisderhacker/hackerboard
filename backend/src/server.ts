import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticPlugin from '@fastify/static'
import multipart from '@fastify/multipart'
import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import { createWriteStream, promises as fsp } from 'fs'
import { pipeline } from 'stream/promises'
import { randomUUID } from 'crypto'
import { registerWienRoutes } from './wien/routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({ logger: true })
const prisma = new PrismaClient()
const PORT = parseInt(process.env.PORT || '3002', 10)
const HOST = '0.0.0.0'
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(__dirname, '../uploads')

await fsp.mkdir(UPLOAD_DIR, { recursive: true })

await fastify.register(cors, {
  origin: true,
})

await fastify.register(multipart, {
  limits: { fileSize: 500 * 1024 * 1024 },
})

const cardInclude = {
  files: true,
  links: true,
  notes: true,
  checklist: true,
  activities: { take: 20, orderBy: { createdAt: 'desc' as const } },
}

/* Tags are stored as a JSON string in SQLite — serialize on the way in, parse on the way out */
function parseCard<T extends { tags: string }>(card: T) {
  let tags: string[] = []
  try {
    tags = JSON.parse(card.tags)
  } catch {
    tags = []
  }
  return { ...card, tags }
}

function pickCardData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  if (typeof body.title === 'string') data.title = body.title
  if (typeof body.description === 'string' || body.description === null) data.description = body.description
  if (typeof body.thumbnail === 'string' || body.thumbnail === null) data.thumbnail = body.thumbnail
  if (typeof body.status === 'string') data.status = body.status
  if (typeof body.priority === 'string' && ['normal', 'high', 'urgent'].includes(body.priority)) data.priority = body.priority
  if (typeof body.nextStep === 'string' || body.nextStep === null) data.nextStep = body.nextStep
  if (typeof body.section === 'string') data.section = body.section
  if (Array.isArray(body.tags)) data.tags = JSON.stringify(body.tags)
  if (typeof body.dueDate === 'string' && body.dueDate) data.dueDate = new Date(body.dueDate)
  if (body.dueDate === null || body.dueDate === '') data.dueDate = null
  return data
}

// API Routes
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

fastify.get('/api/cards', async () => {
  const cards = await prisma.card.findMany({
    include: cardInclude,
    orderBy: { createdAt: 'desc' },
  })
  return cards.map(parseCard)
})

fastify.get('/api/cards/:id', async (request: any, reply) => {
  const card = await prisma.card.findUnique({
    where: { id: request.params.id },
    include: cardInclude,
  })
  if (!card) return reply.code(404).send({ error: 'Card not found' })
  return parseCard(card)
})

fastify.post('/api/cards', async (request: any, reply) => {
  const data = pickCardData(request.body || {})
  if (!data.title) return reply.code(400).send({ error: 'title is required' })
  const card = await prisma.card.create({
    data: {
      ...data,
      title: data.title as string,
      activities: {
        create: { type: 'created', message: 'Card erstellt' },
      },
    },
    include: cardInclude,
  })
  return parseCard(card)
})

fastify.patch('/api/cards/:id', async (request: any, reply) => {
  const data = pickCardData(request.body || {})
  try {
    const card = await prisma.card.update({
      where: { id: request.params.id },
      data: {
        ...data,
        activities: {
          create: { type: 'updated', message: 'Card aktualisiert' },
        },
      },
      include: cardInclude,
    })
    return parseCard(card)
  } catch {
    return reply.code(404).send({ error: 'Card not found' })
  }
})

fastify.delete('/api/cards/:id', async (request: any, reply) => {
  try {
    const card = await prisma.card.findUnique({
      where: { id: request.params.id },
      include: { files: true },
    })
    if (!card) return reply.code(404).send({ error: 'Card not found' })
    // Remove uploaded files from disk along with the card
    for (const file of card.files) {
      const name = file.url.split('/').pop()
      if (name) await fsp.unlink(join(UPLOAD_DIR, name)).catch(() => {})
    }
    await prisma.card.delete({ where: { id: card.id } })
    return { deleted: true }
  } catch {
    return reply.code(404).send({ error: 'Card not found' })
  }
})

fastify.post('/api/cards/:id/links', async (request: any, reply) => {
  const card = await prisma.card.findUnique({ where: { id: request.params.id } })
  if (!card) return reply.code(404).send({ error: 'Card not found' })
  const rawUrl = typeof request.body?.url === 'string' ? request.body.url.trim() : ''
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol')
  } catch {
    return reply.code(400).send({ error: 'valid URL is required' })
  }
  await prisma.link.create({ data: { cardId: card.id, url, title: typeof request.body?.title === 'string' ? request.body.title.trim().slice(0, 120) || null : null } })
  const updated = await prisma.card.findUnique({ where: { id: card.id }, include: cardInclude })
  return parseCard(updated!)
})

fastify.delete('/api/links/:id', async (request: any, reply) => {
  try {
    const link = await prisma.link.delete({ where: { id: request.params.id } })
    const updated = await prisma.card.findUnique({ where: { id: link.cardId }, include: cardInclude })
    return updated ? parseCard(updated) : { deleted: true }
  } catch {
    return reply.code(404).send({ error: 'Link not found' })
  }
})

// File upload — multipart, stores on disk, first image becomes the thumbnail
fastify.post('/api/cards/:id/files', async (request: any, reply) => {
  const card = await prisma.card.findUnique({ where: { id: request.params.id } })
  if (!card) return reply.code(404).send({ error: 'Card not found' })

  const upload = await request.file()
  if (!upload) return reply.code(400).send({ error: 'no file' })

  const ext = extname(upload.filename || '').toLowerCase().slice(0, 10)
  const storedName = `${randomUUID()}${ext}`
  await pipeline(upload.file, createWriteStream(join(UPLOAD_DIR, storedName)))
  const stat = await fsp.stat(join(UPLOAD_DIR, storedName))
  const url = `/uploads/${storedName}`

  await prisma.file.create({
    data: {
      cardId: card.id,
      name: upload.filename || storedName,
      url,
      type: upload.mimetype || 'application/octet-stream',
      size: stat.size,
    },
  })

  const isImage = (upload.mimetype || '').startsWith('image/')
  await prisma.card.update({
    where: { id: card.id },
    data: {
      ...(isImage && !card.thumbnail ? { thumbnail: url } : {}),
      activities: {
        create: { type: 'file', message: `Datei hochgeladen: ${upload.filename}` },
      },
    },
  })

  const updated = await prisma.card.findUnique({ where: { id: card.id }, include: cardInclude })
  return parseCard(updated!)
})

// Checklist
fastify.post('/api/cards/:id/checklist', async (request: any) => {
  return await prisma.checklistItem.create({
    data: { cardId: request.params.id, text: request.body.text },
  })
})

fastify.patch('/api/checklist/:id', async (request: any) => {
  return await prisma.checklistItem.update({
    where: { id: request.params.id },
    data: { completed: !!request.body.completed },
  })
})

await registerWienRoutes(fastify)

// Uploaded files
await fastify.register(staticPlugin, {
  root: UPLOAD_DIR,
  prefix: '/uploads/',
  decorateReply: false,
})

// Serve frontend static files
await fastify.register(staticPlugin, {
  root: join(__dirname, '../public'),
  prefix: '/',
})

// Catch-all for SPA routing
fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api/') || request.url.startsWith('/uploads/')) {
    reply.code(404).send({ error: 'Not found' })
    return
  }
  reply.sendFile('index.html')
})

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST })
    console.log(`Server running at http://${HOST}:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
