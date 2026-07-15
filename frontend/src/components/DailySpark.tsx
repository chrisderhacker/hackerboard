import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Card } from '../types'
import type { TransitData, WeatherData } from './wien-live/types'
import { DailyTransitTile, DailyWeatherTile } from './DailyLiveTiles'
import '../styles/DailySpark.css'

interface DailySparkProps {
  cards: Card[]
  onSelectCard: (card: Card) => void
  onCardCompleted: (card: Card) => void
  selectedCardId?: string
}

const tileShapes = ['feature', 'wide', 'portrait', 'standard', 'standard', 'wide']

function playRewardSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const context = new AudioContextClass()
    ;[523, 659, 784].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = context.currentTime + index * 0.08
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.11, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.24)
    })
  } catch {
    // Audio is an enhancement; the visual reward still works when blocked.
  }
}

function isSameDay(value?: string) {
  if (!value) return false
  const date = new Date(value)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function isWithinDays(value: string | undefined, days: number) {
  if (!value) return false
  return Date.now() - new Date(value).getTime() <= days * 86_400_000
}

export default function DailySpark({ cards, onSelectCard, onCardCompleted, selectedCardId }: DailySparkProps) {
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [reward, setReward] = useState<string | null>(null)
  const [transit,setTransit]=useState<TransitData>()
  const [weather,setWeather]=useState<WeatherData>()
  const [liveLoading,setLiveLoading]=useState(true)
  const [liveError,setLiveError]=useState<string|null>(null)

  const refreshLive=useCallback(async(signal?:AbortSignal)=>{try{setLiveError(null);const [transitResponse,weatherResponse]=await Promise.all([fetch('/api/wien/transit/departures?diva=60200282&line=U2',{signal}),fetch('/api/wien/weather?lat=48.2061223&lon=16.4309681',{signal})]);if(!transitResponse.ok||!weatherResponse.ok)throw new Error('Live-Daten derzeit nicht erreichbar');const [nextTransit,nextWeather]=await Promise.all([transitResponse.json(),weatherResponse.json()]);setTransit(nextTransit);setWeather(nextWeather)}catch(reason){if((reason as Error).name!=='AbortError')setLiveError((reason as Error).message)}finally{setLiveLoading(false)}},[])
  useEffect(()=>{const controller=new AbortController();refreshLive(controller.signal);const timer=window.setInterval(()=>refreshLive(),30_000);return()=>{controller.abort();window.clearInterval(timer)}},[refreshLive])

  const visibleCards = useMemo(() => {
    const ranked = cards.filter((card) => card.section !== 'archive' && card.status !== 'done' && card.status !== 'archived').sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      return aDue - bDue || (b.updatedAt || '').localeCompare(a.updatedAt || '')
    })
    if (shuffleSeed === 0) return ranked.slice(0, 12)
    return ranked
      .map((card, index) => ({ card, order: Math.sin(shuffleSeed * 997 + index * 71) }))
      .sort((a, b) => a.order - b.order)
      .slice(0, 12)
      .map(({ card }) => card)
  }, [cards, shuffleSeed])

  const doneToday = cards.filter((card) => card.status === 'done' && isSameDay(card.updatedAt)).length
  const doneWeek = cards.filter((card) => card.status === 'done' && isWithinDays(card.updatedAt, 7)).length
  const open = cards.filter((card) => card.status !== 'done' && card.status !== 'archived').length
  const mixedOrder=(index:number)=>shuffleSeed===0?index:(index*37+shuffleSeed)%101

  const completeCard = async (event: React.MouseEvent, card: Card) => {
    event.stopPropagation()
    if (card.status === 'done') return
    const response = await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', section: 'archive' }),
    })
    if (!response.ok) return
    const updated = await response.json()
    onCardCompleted(updated)
    playRewardSound()
    setReward(card.title)
    window.setTimeout(() => setReward(null), 2600)
  }

  return (
    <div className="daily-spark">
      <div className="spark-stats">
        <div><span>HEUTE</span><strong>{doneToday} erledigt</strong></div>
        <div><span>DIESE WOCHE</span><strong>{doneWeek} erledigt</strong></div>
        <div><span>NOCH OFFEN</span><strong>{open} Aufgaben</strong></div>
        <div className="streak"><span>CREATIVE STREAK</span><strong>⚡ Weiter so</strong></div>
        <button className="shuffle-button" onClick={() => {setShuffleSeed(Date.now());setLiveLoading(true);refreshLive()}}>✦ Neu mischen</button>
      </div>

      <div className="spark-mosaic">
        <DailyTransitTile data={transit} loading={liveLoading&&!transit} error={!transit?liveError:null} order={mixedOrder(0)}/>
        <DailyWeatherTile data={weather} loading={liveLoading&&!weather} error={!weather?liveError:null} order={mixedOrder(1)}/>
        {visibleCards.map((card, index) => (
          <article
            key={card.id}
            className={`spark-tile ${tileShapes[index % tileShapes.length]} poster-${index % 6} ${card.thumbnail?'has-image':''} ${card.id === selectedCardId ? 'selected' : ''}`}
            style={{order:mixedOrder(index+2)}}
            onClick={() => onSelectCard(card)}
            tabIndex={0}
            onKeyDown={(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelectCard(card)}}}
          >
            <span className="spark-dot-halo" aria-hidden="true" />
            {card.thumbnail ? (
              <img src={card.thumbnail} alt="" />
            ) : (
              <div className={`spark-art art-${index % 5}`} aria-hidden="true"><span>{index % 3 === 0 ? '✦' : index % 3 === 1 ? '◐' : '↗'}</span></div>
            )}
            <div className="spark-tile-copy">
              <span className="spark-kind">{card.dueDate ? 'STEHT AN' : index === 0 ? 'WIEDERENTDECKT' : card.section.toUpperCase()}</span>
              <h3>{card.title}</h3>
              {card.nextStep && <p>NEXT · {card.nextStep}</p>}
              <div className="spark-tile-footer">
                <span>{card.status}</span>
                {card.status !== 'done' && card.status !== 'archived' && (
                  <button onClick={(event) => completeCard(event, card)} title="Als erledigt markieren">✓</button>
                )}
              </div>
            </div>
          </article>
        ))}

        <a className="spark-tile inspiration-feed" style={{order:mixedOrder(visibleCards.length+2)}} href="https://www.midjourney.com/explore?tab=top" target="_blank" rel="noreferrer" aria-label="Midjourney Explore öffnen">
          <div className="feed-grid">
            {Array.from({ length: 6 }).map((_, index) => <i key={index} className={`feed-placeholder feed-${index}`} />)}
          </div>
          <div className="feed-label"><span>MIDJOURNEY EXPLORE</span><strong>Top öffnen ↗</strong></div>
        </a>
      </div>

      <div className={`reward-toast ${reward ? 'show' : ''}`} role="status" aria-live="polite">
        <span>✦</span><div><small>ERLEDIGT · +25 XP</small><strong>{reward}</strong><p>Momentum aufgebaut!</p></div>
      </div>
    </div>
  )
}
