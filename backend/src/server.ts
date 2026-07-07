import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticPlugin from '@fastify/static'
import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({ logger: true })
const prisma = new PrismaClient()
const PORT = parseInt(process.env.PORT || '3002', 10)
const HOST = '0.0.0.0'

await fastify.register(cors, {
  origin: true,
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
  if (typeof body.nextStep === 'string' || body.nextStep === null) data.nextStep = body.nextStep
  if (typeof body.section === 'string') data.section = body.section
  if (Array.isArray(body.tags)) data.tags = JSON.stringify(body.tags)
  if (typeof body.dueDate === 'string') data.dueDate = new Date(body.dueDate)
  if (body.dueDate === null) data.dueDate = null
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
    await prisma.card.delete({ where: { id: request.params.id } })
    return { deleted: true }
  } catch {
    return reply.code(404).send({ error: 'Card not found' })
  }
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

// Serve frontend static files
await fastify.register(staticPlugin, {
  root: join(__dirname, '../public'),
  prefix: '/',
})

// Catch-all for SPA routing
fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api/')) {
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
