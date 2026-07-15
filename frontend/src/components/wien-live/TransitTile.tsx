import TileState from './TileState'
import type { TileProps, TransitData } from './types'

const time = (value: string | null, hour12 = false) => value ? new Intl.DateTimeFormat('de-AT', { timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit', hour12 }).format(new Date(value)) : '–'

export default function TransitTile({ data, loading, error, hour12 = false, compact = false, permanent = false }: TileProps<TransitData> & { hour12?: boolean; compact?: boolean; permanent?: boolean }) {
  const unavailable = data?.state === 'unavailable'
  return <article className={`wien-tile transit-tile ${compact ? 'compact' : 'primary'}`} aria-labelledby={`transit-${data?.station.diva || 'loading'}`}>
    <div className="wien-tile-head"><div><span className="wien-eyebrow">{permanent ? 'FIXIERT · ECHTZEIT' : 'FAVORIT · ECHTZEIT'}</span><h2 id={`transit-${data?.station.diva || 'loading'}`}><b>U2</b> {data?.station.name || 'Donaumarina'}</h2></div><span className="live-dot">LIVE</span></div>
    <TileState loading={loading} error={error || (unavailable ? data?.notice || 'Abfahrtsdaten nicht verfügbar' : null)} notice={data?.state === 'stale' ? 'Daten möglicherweise nicht aktuell' : data?.notice} />
    {data && !unavailable && <>
      {data.disruptions.length > 0 && <div className="transit-alert" role="alert">⚠ {data.disruptions.join(' · ')}</div>}
      <div className="direction-grid">{data.directions.map(direction => <section className="direction" key={`${direction.direction}-${direction.towards}`}><span className="direction-label">U2 → {direction.towards}</span><div className="departure-minutes">{direction.departures.slice(0,3).map((departure,index) => <span key={`${departure.plannedTime}-${index}`}><strong>{departure.countdown}</strong><small>min</small></span>)}</div><div className="departure-details">{direction.departures.slice(0,3).map(departure => <span key={departure.plannedTime} title={`Geplant ${time(departure.plannedTime, hour12)} · Tatsächlich ${time(departure.realTime, hour12)}`}>{time(departure.realTime || departure.plannedTime, hour12)}{departure.delayMinutes > 0 ? ` +${departure.delayMinutes}` : ''}</span>)}</div><p>Aktuelles Intervall: <strong>{direction.actualIntervalMinutes !== null ? `${direction.actualIntervalMinutes} min` : '–'}</strong></p></section>)}</div>
      {data.directions.length === 0 && <div className="wien-empty">Keine aktuellen U2-Abfahrten gemeldet.</div>}
      <footer>Wiener Linien Open Data · Aktualisiert {time(data.updatedAt, hour12)}</footer>
    </>}
  </article>
}
