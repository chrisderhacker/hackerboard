import { useMemo, useState } from 'react'
import TileState from './TileState'
import type { EventsData } from './types'

const clock=(value:string)=>new Intl.DateTimeFormat('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'}).format(new Date(value))

export default function EventsTile({data,loading,error,onShowAll}:{data?:EventsData;loading:boolean;error?:string|null;onShowAll:()=>void}) {
  const [filter,setFilter]=useState('Heute')
  const events=useMemo(()=>{if(!data)return[];return data.events.filter(event=>filter==='Heute'||filter==='Morgen'||filter==='Wochenende'||filter==='In meiner Nähe'||(filter==='Kostenlos'&&event.priceType==='free')||event.category.toLocaleLowerCase('de-AT').includes(filter.toLocaleLowerCase('de-AT')))},[data,filter])
  return <article className="wien-tile events-tile"><div className="wien-tile-head"><div><span className="wien-eyebrow">HEUTE IN WIEN</span><h2>Was läuft?</h2></div><button className="text-button" onClick={onShowAll}>Alle Events</button></div><div className="event-filters" aria-label="Eventfilter">{['Heute','Morgen','Wochenende','Konzerte','Theater','Film','Ausstellung','Festival','Club','Kostenlos','In meiner Nähe'].map(item=><button key={item} className={filter===item?'active':''} onClick={()=>setFilter(item)}>{item}</button>)}</div><TileState loading={loading} error={error} notice={data?.notice} mock={data?.state==='mock'}/>{data&&<div className="event-list">{events.slice(0,5).map(event=><a key={event.id} href={event.sourceUrl||undefined} onClick={event.sourceUrl?undefined:e=>e.preventDefault()} target={event.sourceUrl?'_blank':undefined} rel="noreferrer"><time>{clock(event.start)}</time><div><strong>{event.title}</strong><span>{event.venue}{event.district?` · ${event.district}. Bezirk`:''}{event.distanceKm!==null?` · ${event.distanceKm} km`:''}</span></div><em>{event.priceType==='free'?'Kostenlos':event.category}</em></a>)}{events.length===0&&<div className="wien-empty">Keine passenden Events in dieser Datenquelle.</div>}</div>}</article>
}
