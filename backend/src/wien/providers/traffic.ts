import { fetchJson, wienCache } from '../cache.js'
import type { TrafficResult } from '../types.js'

interface TrafficOptions { startLat: number; startLon: number; destinationLat: number; destinationLon: number; startLabel: string; destinationLabel: string; motorways: boolean; tollRoads: boolean }
interface TomTomRoute { routes?: Array<{ summary?: { travelTimeInSeconds?: number; noTrafficTravelTimeInSeconds?: number; trafficDelayInSeconds?: number } }> }

export async function getTraffic(options: TrafficOptions): Promise<TrafficResult> {
  const provider = (process.env.TRAFFIC_PROVIDER || '').toLowerCase()
  const apiKey = process.env.TRAFFIC_API_KEY || ''
  const base = { route: { start: options.startLabel, destination: options.destinationLabel }, incidents: [] as TrafficResult['incidents'], updatedAt: new Date().toISOString() }
  if (!provider || !apiKey) return { ...base, state: 'unavailable', configured: false, provider: provider || null, currentMinutes: null, normalMinutes: null, delayMinutes: null, status: 'nicht eingerichtet', notice: 'Verkehrsdaten noch nicht eingerichtet' }
  if (provider !== 'tomtom') return { ...base, state: 'unavailable', configured: true, provider, currentMinutes: null, normalMinutes: null, delayMinutes: null, status: 'nicht eingerichtet', notice: `Provider „${provider}“ ist vorbereitet, aber noch nicht implementiert` }

  const key = `traffic:${options.startLat}:${options.startLon}:${options.destinationLat}:${options.destinationLon}:${options.motorways}:${options.tollRoads}`
  const cached = await wienCache.get<TrafficResult>(key, 3 * 60_000, async () => {
    const avoid = [!options.tollRoads ? 'tollRoads' : '', !options.motorways ? 'motorways' : ''].filter(Boolean).join(',')
    const route = `${options.startLat},${options.startLon}:${options.destinationLat},${options.destinationLon}`
    const params = new URLSearchParams({ key: apiKey, traffic: 'true', travelMode: 'car', ...(avoid ? { avoid } : {}) })
    const raw = await fetchJson<TomTomRoute>(`https://api.tomtom.com/routing/1/calculateRoute/${route}/json?${params}`)
    const summary = raw.routes?.[0]?.summary
    if (!summary?.travelTimeInSeconds) throw new Error('Traffic provider returned no route')
    const currentMinutes = Math.round(summary.travelTimeInSeconds / 60)
    const normalMinutes = Math.round((summary.noTrafficTravelTimeInSeconds || summary.travelTimeInSeconds) / 60)
    const delayMinutes = Math.max(0, Math.round((summary.trafficDelayInSeconds || summary.travelTimeInSeconds - (summary.noTrafficTravelTimeInSeconds || summary.travelTimeInSeconds)) / 60))
    const ratio = normalMinutes ? delayMinutes / normalMinutes : 0
    const status: TrafficResult['status'] = ratio >= .5 ? 'schwere Verzögerung' : ratio >= .3 ? 'Stau' : ratio >= .12 ? 'dichter Verkehr' : 'frei'
    return { ...base, state: 'live' as const, configured: true, provider: 'tomtom', currentMinutes, normalMinutes, delayMinutes, status, updatedAt: new Date().toISOString() }
  })
  return { ...cached.value, state: cached.stale ? 'stale' : cached.value.state, notice: cached.stale ? 'Daten möglicherweise nicht aktuell' : cached.value.notice }
}
