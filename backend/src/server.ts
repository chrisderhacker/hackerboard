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

// API Routes
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

fastify.get('/api/cards', async () => {
  return await prisma.card.findMany({
    include: {
      files: true,
      links: true,
      notes: true,
      checklist: true,
      activities: { take: 5, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
})

fastify.get('/api/cards/:id', async (request: any) => {
  const { id } = request.params
  return await prisma.card.findUnique({
    where: { id },
    include: {
      files: true,
      links: true,
      notes: true,
      checklist: true,
      activities: { orderBy: { createdAt: 'desc' } },
    },
  })
})

fastify.post('/api/cards', async (request: any) => {
  return await prisma.card.create({
    data: {
      title: request.body.title,
      description: request.body.description,
      section: request.body.section || 'inbox',
      status: request.body.status || 'inbox',
      tags: request.body.tags || [],
    },
  })
})

fastify.patch('/api/cards/:id', async (request: any) => {
  const { id } = request.params
  return await prisma.card.update({
    where: { id },
    data: request.body,
  })
})

fastify.delete('/api/cards/:id', async (request: any) => {
  const { id } = request.params
  return await prisma.card.delete({ where: { id } })
})

// Serve frontend static files
await fastify.register(staticPlugin, {
  root: join(__dirname, '../public'),
  prefix: '/',
})

// Catch-all for SPA routing
fastify.setNotFoundHandler((request, reply) => {
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
