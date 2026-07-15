import TileState from './TileState'
import GoogleTrafficMap from './GoogleTrafficMap'
import type { TileProps, TrafficData } from './types'

export default function TrafficTile({ data, loading, error }: TileProps<TrafficData>) {
  const severity = data?.status === 'frei' ? 'ok' : data?.status === 'dichter Verkehr' ? 'warning' : data?.configured ? 'danger' : 'muted'
  return <article className={`wien-tile traffic-tile ${severity}`}>
    <div className="wien-tile-head"><div><span className="wien-eyebrow">TANGENTE</span><h2>A23 → Wiener Neustadt</h2></div><span className="traffic-status">{data?.status || 'Status'}</span></div>
    <TileState loading={loading} error={error} notice={data?.notice} />
    {data && <GoogleTrafficMap traffic={data} />}
    {data?.configured && data.currentMinutes !== null ? <div className="traffic-summary">
      <div className="traffic-time"><strong>{data.currentMinutes}</strong><span>min<br/><small>aktuell</small></span><b>+{data.delayMinutes || 0} min</b></div>
      <div className="traffic-normal">Normal ohne starken Verkehr: {data.normalMinutes} min · Quelle: {data.provider === 'google' ? 'Google Routes' : 'TomTom'}</div>
      {data.incidents.length > 0 ? <ul className="incident-list">{data.incidents.map((incident,index)=><li key={index}>⚠ {incident.description}</li>)}</ul> : <p className="no-incidents">Die farbigen Straßen in der Karte zeigen die aktuelle Verkehrslage.</p>}
    </div> : !loading && !error && <div className="provider-empty"><strong>Verkehrsdaten noch nicht eingerichtet</strong><p>Google Routes API und Browser-Karte serverseitig konfigurieren.</p></div>}
    <footer>{data?.route.start || 'Donaumarina, Wien'} → {data?.route.destination || 'Wiener Neustadt Zentrum'}</footer>
  </article>
}
