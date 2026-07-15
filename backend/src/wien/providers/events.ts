import type { EventsResult, ViennaEvent } from '../types.js'

function mockEvents(): ViennaEvent[] {
  const now = new Date()
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const offsetName = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Vienna', timeZoneName: 'longOffset' }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value ?? 'GMT+01:00'
  const offset = offsetName.replace('GMT', '')
  const base = new Date(`${date}T19:30:00${offset}`)
  return [
    { id: 'mock-concert', title: 'Beispiel: Konzert am Donaukanal', start: base.toISOString(), end: null, venue: 'Beispielort Wien', district: 2, category: 'Konzert', priceType: 'free', imageUrl: null, sourceName: 'Mock-Provider', sourceUrl: null, latitude: null, longitude: null, distanceKm: null, isMock: true },
    { id: 'mock-exhibition', title: 'Beispiel: Abendöffnung Ausstellung', start: new Date(base.getTime() + 60 * 60_000).toISOString(), end: null, venue: 'Beispielmuseum', district: 1, category: 'Ausstellung', priceType: 'paid', imageUrl: null, sourceName: 'Mock-Provider', sourceUrl: null, latitude: null, longitude: null, distanceKm: null, isMock: true },
  ]
}

export async function getEvents(): Promise<EventsResult> {
  return { state: 'mock', configured: false, source: 'Mock-Provider', events: mockEvents(), updatedAt: new Date().toISOString(), notice: 'Beispieldaten – noch keine Event-API eingerichtet' }
}
