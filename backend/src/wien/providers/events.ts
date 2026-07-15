import type { EventsResult, ViennaEvent } from '../types.js'

function mockEvents(): ViennaEvent[] {
  const base = new Date()
  base.setHours(19, 30, 0, 0)
  return [
    { id: 'mock-concert', title: 'Beispiel: Konzert am Donaukanal', start: base.toISOString(), end: null, venue: 'Beispielort Wien', district: 2, category: 'Konzert', priceType: 'free', imageUrl: null, sourceName: 'Mock-Provider', sourceUrl: null, latitude: null, longitude: null, distanceKm: null, isMock: true },
    { id: 'mock-exhibition', title: 'Beispiel: Abendöffnung Ausstellung', start: new Date(base.getTime() + 60 * 60_000).toISOString(), end: null, venue: 'Beispielmuseum', district: 1, category: 'Ausstellung', priceType: 'paid', imageUrl: null, sourceName: 'Mock-Provider', sourceUrl: null, latitude: null, longitude: null, distanceKm: null, isMock: true },
  ]
}

export async function getEvents(): Promise<EventsResult> {
  return { state: 'mock', configured: false, source: 'Mock-Provider', events: mockEvents(), updatedAt: new Date().toISOString(), notice: 'Beispieldaten – noch keine Event-API eingerichtet' }
}
