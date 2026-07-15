import { fetchJson, fetchText, wienCache } from '../cache.js'
import type { Departure, TransitDirection, TransitResult } from '../types.js'

const MONITOR_URL = 'https://www.wienerlinien.at/ogd_realtime/monitor'
const STATIONS_URL = 'https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-haltestellen.csv'
export const DONAUMARINA_DIVA = '60200282'

interface RawDeparture { departureTime?: { timePlanned?: string; timeReal?: string; countdown?: number } }
interface RawLine { name?: string; towards?: string; direction?: string; platform?: string; departures?: { departure?: RawDeparture[] } }
interface RawMonitor { locationStop?: { geometry?: { coordinates?: number[] }; properties?: { name?: string; title?: string } }; lines?: RawLine[] }
interface MonitorResponse { data?: { monitors?: RawMonitor[]; trafficInfos?: Array<{ title?: string; description?: string }> }; message?: { serverTime?: string } }

function normalizeTime(value?: string) {
  return value ? value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2') : null
}

function mapDepartures(raw: RawDeparture[] = []): Departure[] {
  return raw.slice(0, 3).map(({ departureTime = {} }) => {
    const plannedTime = normalizeTime(departureTime.timePlanned) || new Date().toISOString()
    const realTime = normalizeTime(departureTime.timeReal)
    const delay = realTime ? Math.max(0, Math.round((new Date(realTime).getTime() - new Date(plannedTime).getTime()) / 60000)) : 0
    return { plannedTime, realTime, countdown: Math.max(0, departureTime.countdown ?? 0), delayMinutes: delay }
  })
}

function interval(departures: Departure[]) {
  if (departures.length < 2) return null
  const differences = departures.slice(1).map((item, index) => Math.max(0, item.countdown - departures[index].countdown))
  return Math.round(differences.reduce((sum, value) => sum + value, 0) / differences.length)
}

export async function getDepartures(diva = DONAUMARINA_DIVA, line = 'U2'): Promise<TransitResult> {
  if (!/^\d{5,10}$/.test(diva)) throw new Error('Ungültige DIVA-ID')
  const key = `transit:${diva}:${line}`
  const cached = await wienCache.get(key, 20_000, async () => {
    const url = `${MONITOR_URL}?diva=${encodeURIComponent(diva)}&activateTrafficInfo=stoerungkurz`
    const raw = await fetchJson<MonitorResponse>(url)
    const monitors = raw.data?.monitors || []
    const grouped = new Map<string, TransitDirection>()
    let stationName = diva === DONAUMARINA_DIVA ? 'Donaumarina' : 'Haltestelle'
    let latitude = 0
    let longitude = 0
    for (const monitor of monitors) {
      stationName = monitor.locationStop?.properties?.title?.replace(/ U$/, '') || stationName
      const coordinates = monitor.locationStop?.geometry?.coordinates || []
      longitude = coordinates[0] ?? longitude
      latitude = coordinates[1] ?? latitude
      for (const item of monitor.lines || []) {
        if (item.name?.toUpperCase() !== line.toUpperCase()) continue
        const departures = mapDepartures(item.departures?.departure)
        const groupKey = `${item.direction || ''}:${item.towards || ''}`
        if (!grouped.has(groupKey) || departures.length > (grouped.get(groupKey)?.departures.length || 0)) {
          grouped.set(groupKey, { line: item.name || line, towards: item.towards || 'Richtung unbekannt', direction: item.direction || '', platform: item.platform, departures, actualIntervalMinutes: interval(departures) })
        }
      }
    }
    const disruptions = (raw.data?.trafficInfos || []).map(info => info.title || info.description || '').filter(Boolean)
    return { state: 'live' as const, source: 'Wiener Linien Open Data', station: { diva, name: stationName, latitude, longitude, permanent: diva === DONAUMARINA_DIVA }, directions: [...grouped.values()].slice(0, 2), disruptions, updatedAt: normalizeTime(raw.message?.serverTime) || new Date().toISOString(), notice: grouped.size === 0 ? `Keine aktuellen ${line}-Abfahrten gemeldet` : undefined }
  })
  return { ...cached.value, state: cached.stale ? 'stale' : cached.value.state, notice: cached.stale ? 'Daten möglicherweise nicht aktuell' : cached.value.notice }
}

export async function searchStations(query: string) {
  const normalized = query.trim().toLocaleLowerCase('de-AT')
  if (normalized.length < 2) return []
  const cached = await wienCache.get('transit:stations', 6 * 60 * 60_000, () => fetchText(STATIONS_URL), 24 * 60 * 60_000)
  const seen = new Set<string>()
  return cached.value.split(/\r?\n/).slice(1).map(row => row.split(';')).filter(columns => columns.length >= 6 && columns[1]?.toLocaleLowerCase('de-AT').includes(normalized)).map(columns => ({ diva: columns[0], name: columns[1], latitude: Number(columns[5]), longitude: Number(columns[4]) })).filter(station => { if (seen.has(station.diva)) return false; seen.add(station.diva); return true }).slice(0, 20)
}
