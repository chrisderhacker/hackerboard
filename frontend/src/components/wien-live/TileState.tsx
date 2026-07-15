interface Props { loading: boolean; error?: string | null; notice?: string; mock?: boolean }
export default function TileState({ loading, error, notice, mock }: Props) {
  if (loading) return <div className="wien-tile-state" role="status"><span className="wien-spinner" /> Daten werden geladen …</div>
  if (error) return <div className="wien-tile-state error" role="alert">⚠ {error}</div>
  if (mock) return <div className="wien-source-badge mock">BEISPIELDATEN</div>
  if (notice) return <div className="wien-source-badge">⚠ {notice}</div>
  return null
}
