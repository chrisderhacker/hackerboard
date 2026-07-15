import { fetchJson, wienCache } from '../cache.js'
import type { TrafficResult } from '../types.js'

interface TrafficOptions { startLat: number; startLon: number; destinationLat: number; destinationLon: number; startLabel: string; destinationLabel: string; motorways: boolean; tollRoads: boolean }
interface TomTomRoute { routes?: Array<{ summary?: { travelTimeInSeconds?: number; noTrafficTravelTimeInSeconds?: number; trafficDelayInSeconds?: number } }> }
interface GoogleRoutesResponse { routes?: Array<{ duration?: string; staticDuration?: string; polyline?: { encodedPolyline?: string } }> }

function seconds(value?: string) { return Number(value?.replace(/s$/, '') || 0) }
function trafficStatus(currentMinutes: number, normalMinutes: number): TrafficResult['status'] {
  const ratio = normalMinutes ? Math.max(0, currentMinutes - normalMinutes) / normalMinutes : 0
  return ratio >= .5 ? 'schwere Verzögerung' : ratio >= .3 ? 'Stau' : ratio >= .12 ? 'dichter Verkehr' : 'frei'
}

async function fetchGoogleRoute(options: TrafficOptions, apiKey: string): Promise<GoogleRoutesResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 9000)
  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.polyline.encodedPolyline' },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: options.startLat, longitude: options.startLon } } },
        destination: { location: { latLng: { latitude: options.destinationLat, longitude: options.destinationLon } } },
        travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE_OPTIMAL', computeAlternativeRoutes: false,
        routeModifiers: { avoidTolls: !options.tollRoads, avoidHighways: !options.motorways },
        languageCode: 'de-AT', units: 'METRIC',
      }),
    })
    if (!response.ok) throw new Error(`Google Routes HTTP ${response.status}`)
    return await response.json() as GoogleRoutesResponse
  } finally { clearTimeout(timer) }
}

export async function getTraffic(options: TrafficOptions): Promise<TrafficResult> {
  const provider = (process.env.TRAFFIC_PROVIDER || '').toLowerCase()
  const apiKey = process.env.TRAFFIC_API_KEY || ''
  const map = { enabled: Boolean(process.env.GOOGLE_MAPS_BROWSER_API_KEY), provider: 'google' as const, browserApiKey: process.env.GOOGLE_MAPS_BROWSER_API_KEY || null, start: { lat: options.startLat, lng: options.startLon }, destination: { lat: options.destinationLat, lng: options.destinationLon }, encodedPolyline: null as string | null }
  const base = { route: { start: options.startLabel, destination: options.destinationLabel }, incidents: [] as TrafficResult['incidents'], map, updatedAt: new Date().toISOString() }
  if (!provider || !apiKey) return { ...base, state: 'unavailable', configured: false, provider: provider || null, currentMinutes: null, normalMinutes: null, delayMinutes: null, status: 'nicht eingerichtet', notice: 'Verkehrsdaten noch nicht eingerichtet' }
  if (!['tomtom', 'google'].includes(provider)) return { ...base, state: 'unavailable', configured: true, provider, currentMinutes: null, normalMinutes: null, delayMinutes: null, status: 'nicht eingerichtet', notice: `Provider „${provider}“ wird nicht unterstützt` }

  const key = `traffic:${provider}:${options.startLat}:${options.startLon}:${options.destinationLat}:${options.destinationLon}:${options.motorways}:${options.tollRoads}`
  const cached = await wienCache.get<TrafficResult>(key, 3 * 60_000, async () => {
    if (provider === 'google') {
      const raw = await fetchGoogleRoute(options, apiKey)
      const route = raw.routes?.[0]
      const currentSeconds = seconds(route?.duration)
      if (!currentSeconds) throw new Error('Google Routes lieferte keine Route')
      const normalSeconds = seconds(route?.staticDuration) || currentSeconds
      const currentMinutes = Math.max(1, Math.round(currentSeconds / 60))
      const normalMinutes = Math.max(1, Math.round(normalSeconds / 60))
      const delayMinutes = Math.max(0, currentMinutes - normalMinutes)
      return { ...base, map: { ...map, encodedPolyline: route?.polyline?.encodedPolyline || null }, state: 'live', configured: true, provider: 'google', currentMinutes, normalMinutes, delayMinutes, status: trafficStatus(currentMinutes, normalMinutes), updatedAt: new Date().toISOString() }
    }
    const avoid = [!options.tollRoads ? 'tollRoads' : '', !options.motorways ? 'motorways' : ''].filter(Boolean).join(',')
    const route = `${options.startLat},${options.startLon}:${options.destinationLat},${options.destinationLon}`
    const params = new URLSearchParams({ key: apiKey, traffic: 'true', travelMode: 'car', ...(avoid ? { avoid } : {}) })
    const raw = await fetchJson<TomTomRoute>(`https://api.tomtom.com/routing/1/calculateRoute/${route}/json?${params}`)
    const summary = raw.routes?.[0]?.summary
    if (!summary?.travelTimeInSeconds) throw new Error('Traffic provider returned no route')
    const currentMinutes = Math.round(summary.travelTimeInSeconds / 60)
    const normalMinutes = Math.round((summary.noTrafficTravelTimeInSeconds || summary.travelTimeInSeconds) / 60)
    const delayMinutes = Math.max(0, Math.round((summary.trafficDelayInSeconds || summary.travelTimeInSeconds - (summary.noTrafficTravelTimeInSeconds || summary.travelTimeInSeconds)) / 60))
    const status = trafficStatus(currentMinutes, normalMinutes)
    return { ...base, state: 'live' as const, configured: true, provider: 'tomtom', currentMinutes, normalMinutes, delayMinutes, status, updatedAt: new Date().toISOString() }
  })
  return { ...cached.value, state: cached.stale ? 'stale' : cached.value.state, notice: cached.stale ? 'Daten möglicherweise nicht aktuell' : cached.value.notice }
}
