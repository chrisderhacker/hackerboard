import type { TransitData, WeatherData } from './wien-live/types'

const clock = (value:string|null) => value ? new Intl.DateTimeFormat('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'}).format(new Date(value)) : '–'
const weatherIcons:Record<number,string>={0:'☀',1:'◒',2:'◒',3:'☁',45:'≋',48:'≋',51:'☂',53:'☂',55:'☂',61:'☂',63:'☂',65:'☂',71:'❄',73:'❄',75:'❄',80:'☂',81:'☂',82:'☂',95:'ϟ',96:'ϟ',99:'ϟ'}

export function DailyTransitTile({data,loading,error,order}:{data?:TransitData;loading:boolean;error:string|null;order:number}) {
  return <article className="spark-tile spark-live-transit wide" style={{order}}>
    <div className="daily-live-head"><span>JETZT · DONAUMARINA</span><b>U2 LIVE</b></div>
    {loading&&<div className="daily-live-state">Abfahrten werden geladen …</div>}
    {error&&<div className="daily-live-state error">⚠ {error}</div>}
    {data&&<div className="daily-directions">{data.directions.slice(0,2).map(direction=><section key={`${direction.direction}-${direction.towards}`}><span>U2 → {direction.towards}</span><div>{direction.departures.slice(0,3).map((departure,index)=><strong key={departure.plannedTime} className={index===0?'next':''}>{departure.countdown}<small>min</small></strong>)}</div><p>Intervall {direction.actualIntervalMinutes ?? '–'} min · {clock(direction.departures[0]?.realTime||direction.departures[0]?.plannedTime)}</p></section>)}</div>}
    {data?.disruptions.length ? <div className="daily-transit-alert">⚠ {data.disruptions.join(' · ')}</div> : <footer>Wiener Linien · aktualisiert {data?clock(data.updatedAt):'–'}</footer>}
  </article>
}

export function DailyWeatherTile({data,loading,error,order}:{data?:WeatherData;loading:boolean;error:string|null;order:number}) {
  return <article className="spark-tile spark-live-weather wide" style={{order}}>
    <div className="daily-live-head"><span>WETTER · WIEN</span><b>{data?weatherIcons[data.weatherCode]||'◌':'◌'}</b></div>
    {loading&&<div className="daily-live-state dark">Wetter wird geladen …</div>}
    {error&&<div className="daily-live-state dark">⚠ {error}</div>}
    {data&&<div className="daily-weather-content"><strong>{Math.round(data.temperature)}°</strong><div><b>{data.condition}</b><span>Gefühlt {Math.round(data.apparentTemperature)}°</span><small>{data.precipitationProbability}% Regen · {Math.round(data.windSpeed)} km/h Wind</small></div></div>}
    <footer>{data?.warning ? `⚠ ${data.warning}` : data ? `H ${Math.round(data.high)}° · T ${Math.round(data.low)}° · Sonnenuntergang ${clock(data.sunset)}` : 'Open-Meteo'}</footer>
  </article>
}
