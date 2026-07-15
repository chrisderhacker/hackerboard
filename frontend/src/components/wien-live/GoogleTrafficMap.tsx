import { useEffect, useRef, useState } from 'react'
import type { TrafficData } from './types'

declare global { interface Window { google?: any; __wienGoogleMapsPromise?: Promise<void> } }

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve()
  if (window.__wienGoogleMapsPromise) return window.__wienGoogleMapsPromise
  window.__wienGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry&v=weekly&loading=async`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Maps konnte nicht geladen werden'))
    document.head.appendChild(script)
  })
  return window.__wienGoogleMapsPromise
}

export default function GoogleTrafficMap({ traffic }: { traffic: TrafficData }) {
  const host = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const config = traffic.map

  useEffect(() => {
    if (!config?.enabled || !config.browserApiKey || !host.current) return
    let disposed = false
    loadGoogleMaps(config.browserApiKey).then(() => {
      if (disposed || !host.current || !window.google?.maps) return
      const google = window.google
      const map = new google.maps.Map(host.current, { center: config.start, zoom: 10, disableDefaultUI: true, zoomControl: true, gestureHandling: 'cooperative', styles: [{ elementType: 'geometry', stylers: [{ color: '#141225' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#b9c0cb' }] }, { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0d16' }] }] })
      new google.maps.TrafficLayer().setMap(map)
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(config.start); bounds.extend(config.destination)
      if (config.encodedPolyline && google.maps.geometry?.encoding) {
        const path = google.maps.geometry.encoding.decodePath(config.encodedPolyline)
        new google.maps.Polyline({ path, map, strokeColor: '#ccff00', strokeOpacity: .9, strokeWeight: 4 })
        path.forEach((point: any) => bounds.extend(point))
      }
      map.fitBounds(bounds, 34)
    }).catch(reason => setError(reason instanceof Error ? reason.message : 'Karte nicht verfügbar'))
    return () => { disposed = true }
  }, [config?.browserApiKey, config?.encodedPolyline, config?.start.lat, config?.start.lng, config?.destination.lat, config?.destination.lng])

  if (!config?.enabled || !config.browserApiKey) return <div className="traffic-map-empty">Google-Verkehrskarte noch nicht eingerichtet</div>
  return <div className="traffic-map-wrap"><div ref={host} className="traffic-map" role="img" aria-label={`Live-Verkehrskarte von ${traffic.route.start} nach ${traffic.route.destination}`} />{error&&<div className="traffic-map-error" role="alert">{error}</div>}<span className="traffic-map-live">● LIVE-VERKEHR</span></div>
}
