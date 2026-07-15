import type { FastifyInstance } from 'fastify'
import { DONAUMARINA_DIVA, getDepartures, searchStations } from './providers/transit.js'
import { getTraffic } from './providers/traffic.js'
import { getWeather } from './providers/weather.js'
import { getEvents } from './providers/events.js'

function numberParam(value: unknown, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function boolParam(value: unknown, fallback: boolean) { return value === undefined ? fallback : value === true || value === 'true' }

export async function registerWienRoutes(fastify: FastifyInstance) {
  fastify.get('/api/wien/transit/stations', async (request: any) => ({ stations: await searchStations(String(request.query?.q || '')) }))
  fastify.get('/api/wien/transit/departures', async (request: any) => getDepartures(String(request.query?.diva || DONAUMARINA_DIVA), String(request.query?.line || 'U2')))
  fastify.get('/api/wien/weather', async (request: any) => getWeather(numberParam(request.query?.lat, 48.2061223), numberParam(request.query?.lon, 16.4309681)))
  fastify.get('/api/wien/traffic', async (request: any) => getTraffic({ startLat: numberParam(request.query?.startLat, numberParam(process.env.TRAFFIC_START_LAT, 48.2061223)), startLon: numberParam(request.query?.startLon, numberParam(process.env.TRAFFIC_START_LON, 16.4309681)), destinationLat: numberParam(request.query?.destinationLat, numberParam(process.env.TRAFFIC_DESTINATION_LAT, 47.815),), destinationLon: numberParam(request.query?.destinationLon, numberParam(process.env.TRAFFIC_DESTINATION_LON, 16.244)), startLabel: String(request.query?.start || 'Donaumarina, Wien'), destinationLabel: String(request.query?.destination || 'Wiener Neustadt Zentrum'), motorways: boolParam(request.query?.motorways, true), tollRoads: boolParam(request.query?.tollRoads, true) }))
  fastify.get('/api/wien/events', async () => getEvents())
  fastify.get('/api/wien/dashboard', async (request: any) => {
    const query = request.query || {}
    const tasks = {
      transit: getDepartures(String(query.diva || DONAUMARINA_DIVA), String(query.line || 'U2')),
      traffic: getTraffic({ startLat: numberParam(query.startLat, numberParam(process.env.TRAFFIC_START_LAT, 48.2061223)), startLon: numberParam(query.startLon, numberParam(process.env.TRAFFIC_START_LON, 16.4309681)), destinationLat: numberParam(query.destinationLat, numberParam(process.env.TRAFFIC_DESTINATION_LAT, 47.815)), destinationLon: numberParam(query.destinationLon, numberParam(process.env.TRAFFIC_DESTINATION_LON, 16.244)), startLabel: String(query.start || 'Donaumarina, Wien'), destinationLabel: String(query.destination || 'Wiener Neustadt Zentrum'), motorways: boolParam(query.motorways, true), tollRoads: boolParam(query.tollRoads, true) }),
      weather: getWeather(numberParam(query.weatherLat, 48.2061223), numberParam(query.weatherLon, 16.4309681)),
      events: getEvents(),
    }
    const entries = await Promise.allSettled(Object.values(tasks))
    const keys = Object.keys(tasks)
    const result: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    entries.forEach((entry, index) => { result[keys[index]] = entry.status === 'fulfilled' ? entry.value : { state: 'unavailable', notice: entry.reason instanceof Error ? entry.reason.message : 'Datenquelle nicht erreichbar', updatedAt: new Date().toISOString() } })
    return result
  })
}
