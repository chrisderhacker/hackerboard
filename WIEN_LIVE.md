# Wien Live — Architektur

## Geänderte Dateien

- `backend/src/server.ts` — registriert die neuen internen Wien-Live-Routen.
- `frontend/src/App.tsx` und `frontend/src/App.css` — bindet den eigenständigen Dashboard-Bereich ein.
- `frontend/src/components/Sidebar.tsx` — ergänzt den Navigationseintrag „Wien Live“.
- `.env.example`, `README.md`, `DOKUMENTATION.md` — Konfiguration, Datenquellen und Betrieb.

## Neue Backend-Dateien

- `backend/src/wien/types.ts` — einheitliche interne Datenmodelle.
- `backend/src/wien/cache.ts` — TTL-Cache, Request-Coalescing, Timeout und Stale-Fallback.
- `backend/src/wien/routes.ts` — Transit-, Traffic-, Wetter-, Event- und kombinierte Dashboard-Routen.
- `backend/src/wien/providers/transit.ts` — Wiener Linien Open Data, DIVA-/Stationsauflösung und reale Intervallberechnung.
- `backend/src/wien/providers/weather.ts` — austauschbarer Open-Meteo-Wetterprovider.
- `backend/src/wien/providers/traffic.ts` — Provider-Schnittstelle und optionale TomTom-Anbindung.
- `backend/src/wien/providers/events.ts` — einheitliches Eventmodell und klar markierter Mock-Provider.

## Neue Frontend-Dateien

- `frontend/src/components/wien-live/WienLiveDashboard.tsx` — Datenabruf, Auto-Refresh, Offline- und Stale-Verhalten.
- `TransitTile.tsx`, `TrafficTile.tsx`, `WeatherTile.tsx`, `EventsTile.tsx` — unabhängige Kacheln mit eigenen Zuständen.
- `WienSettingsPanel.tsx` — Favoriten, Route, Wetter, Events und Darstellung; Speicherung in `localStorage`.
- `TileState.tsx`, `types.ts` — gemeinsame Zustände und Frontendmodelle.
- `frontend/src/styles/WienLive.css` — vollständig responsive Wien-Live-Oberfläche.

## Datenquellen und Verhalten

- U-Bahn: Wiener Linien Open Data, Standard-DIVA `60200282` (Donaumarina), Cache 20 Sekunden.
- Wetter: Open-Meteo, Standardkoordinaten Donaumarina, Cache 10 Minuten.
- Verkehr: ohne `TRAFFIC_PROVIDER`/`TRAFFIC_API_KEY` keine erfundenen Zeiten; TomTom ist als erster Provider implementiert.
- Events: bis zur Auswahl einer zuverlässigen Quelle ausschließlich deutlich gekennzeichnete Beispieldaten.
- Fehler einer Quelle blockieren die übrigen Kacheln nicht. Bei vorhandenem Cache werden alte Daten mit einem Aktualitätshinweis weitergegeben.
