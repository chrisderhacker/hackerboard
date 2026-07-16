import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

function urgencyFor(card: Card, now = new Date()) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const due = card.dueDate?.slice(0, 10)
  if (due && due < today) return { level: 'urgent', label: 'ÜBERFÄLLIG' }
  if (due === today) return { level: 'urgent', label: 'HEUTE FÄLLIG' }
  if (card.priority === 'urgent') return { level: 'urgent', label: 'JETZT' }
  if (card.priority === 'high') return { level: 'high', label: 'WICHTIG' }
  return { level: 'normal', label: 'NORMAL' }
}

export default function DailySpark({ cards, onSelectCard, onCardCompleted, selectedCardId }: DailySparkProps) {
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [reward, setReward] = useState<string | null>(null)
  const [transit,setTransit]=useState<TransitData>()
  const [weather,setWeather]=useState<WeatherData>()
  const [liveLoading,setLiveLoading]=useState(true)
  const [liveError,setLiveError]=useState<string|null>(null)
  const [imageShapes,setImageShapes]=useState<Record<string,'standard'|'wide'|'portrait'>>({})
  const [now,setNow]=useState(()=>new Date())
  const [isFullscreen,setIsFullscreen]=useState(false)
  const [focusMode,setFocusMode]=useState(false)
  const [hoveredCardId,setHoveredCardId]=useState<string|null>(null)
  const infiniteBoardRef=useRef<HTMLDivElement>(null)
  const dailySparkRef=useRef<HTMLDivElement>(null)
  const hoveredCardRef=useRef<string|null>(null)
  const panVelocityRef=useRef({x:0,y:0})
  const snapTimerRef=useRef<number|undefined>(undefined)
  const snapFrameRef=useRef<number|undefined>(undefined)
  const idleTimerRef=useRef<number|undefined>(undefined)
  const idleDirectionTimerRef=useRef<number|undefined>(undefined)
  const idleActiveRef=useRef(false)
  const idleVelocityRef=useRef({x:0,y:0})
  const idleTargetRef=useRef({x:0,y:0})

  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),1_000);const handleFullscreen=()=>setIsFullscreen(document.fullscreenElement===dailySparkRef.current);document.addEventListener('fullscreenchange',handleFullscreen);return()=>{window.clearInterval(timer);document.removeEventListener('fullscreenchange',handleFullscreen)}},[])
  useEffect(()=>{const handleFocusKey=(event:KeyboardEvent)=>{const target=event.target as HTMLElement;if(target.matches('input, textarea, select, [contenteditable="true"]'))return;if(event.key.toLowerCase()==='f'){event.preventDefault();setFocusMode(current=>!current)}else if(event.key==='Escape')setFocusMode(false)};window.addEventListener('keydown',handleFocusKey);return()=>window.removeEventListener('keydown',handleFocusKey)},[])
  useEffect(()=>{let frame=0;const pan=()=>{const board=infiniteBoardRef.current;const velocity=panVelocityRef.current;if(board&&!focusMode&&(velocity.x||velocity.y)){board.scrollLeft+=velocity.x;board.scrollTop+=velocity.y}frame=requestAnimationFrame(pan)};frame=requestAnimationFrame(pan);return()=>cancelAnimationFrame(frame)},[focusMode])
  useEffect(()=>{const timer=window.setInterval(()=>{const board=infiniteBoardRef.current;if(!board||focusMode||!idleActiveRef.current)return;idleVelocityRef.current.x+=(idleTargetRef.current.x-idleVelocityRef.current.x)*.045;idleVelocityRef.current.y+=(idleTargetRef.current.y-idleVelocityRef.current.y)*.045;board.scrollLeft+=idleVelocityRef.current.x*3;board.scrollTop+=idleVelocityRef.current.y*3},50);return()=>window.clearInterval(timer)},[focusMode])

  const refreshLive=useCallback(async(signal?:AbortSignal)=>{try{setLiveError(null);const [transitResponse,weatherResponse]=await Promise.all([fetch('/api/wien/transit/departures?diva=60200282&line=U2',{signal}),fetch('/api/wien/weather?lat=48.2061223&lon=16.4309681',{signal})]);if(!transitResponse.ok||!weatherResponse.ok)throw new Error('Live-Daten derzeit nicht erreichbar');const [nextTransit,nextWeather]=await Promise.all([transitResponse.json(),weatherResponse.json()]);setTransit(nextTransit);setWeather(nextWeather)}catch(reason){if((reason as Error).name!=='AbortError')setLiveError((reason as Error).message)}finally{setLiveLoading(false)}},[])
  useEffect(()=>{const controller=new AbortController();refreshLive(controller.signal);const timer=window.setInterval(()=>refreshLive(),30_000);return()=>{controller.abort();window.clearInterval(timer)}},[refreshLive])

  const visibleCards = useMemo(() => {
    const ranked = cards.filter((card) => card.section !== 'archive' && card.status !== 'done' && card.status !== 'archived').sort((a, b) => {
      const urgencyRank = { urgent: 0, high: 1, normal: 2 }
      const urgencyDifference = urgencyRank[urgencyFor(a).level as keyof typeof urgencyRank] - urgencyRank[urgencyFor(b).level as keyof typeof urgencyRank]
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      return urgencyDifference || aDue - bDue || (b.updatedAt || '').localeCompare(a.updatedAt || '')
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
  const focusCard=visibleCards.find(card=>card.id===hoveredCardId)||visibleCards[0]
  const cancelBoardSnap=()=>{window.clearTimeout(snapTimerRef.current);if(snapFrameRef.current)cancelAnimationFrame(snapFrameRef.current);snapFrameRef.current=undefined;infiniteBoardRef.current?.classList.remove('snapping')}
  const queueBoardSnap=(delay=520)=>{window.clearTimeout(snapTimerRef.current);snapTimerRef.current=window.setTimeout(()=>{const board=infiniteBoardRef.current;if(!board||board.classList.contains('auto-panning')||idleActiveRef.current)return;const panelWidth=board.scrollWidth/3;const columns=panelWidth<=760?2:panelWidth<=1200?4:5;const stepX=panelWidth/columns;const mosaic=board.querySelector('.spark-mosaic');const styles=mosaic?getComputedStyle(mosaic):null;const row=parseFloat(styles?.gridAutoRows||'156')||156;const gap=parseFloat(styles?.rowGap||'7')||7;const stepY=row+gap;const left=Math.round(board.scrollLeft/stepX)*stepX;const top=Math.round(board.scrollTop/stepY)*stepY;const startLeft=board.scrollLeft;const startTop=board.scrollTop;if(Math.abs(left-startLeft)<1&&Math.abs(top-startTop)<1)return;const started=performance.now();const duration=1500;board.classList.add('snapping');const animate=(time:number)=>{const progress=Math.min(1,(time-started)/duration);const eased=progress<.5?2*progress*progress:1-Math.pow(-2*progress+2,2)/2;board.scrollLeft=startLeft+(left-startLeft)*eased;board.scrollTop=startTop+(top-startTop)*eased;if(progress<1)snapFrameRef.current=requestAnimationFrame(animate);else{snapFrameRef.current=undefined;board.classList.remove('snapping')}};snapFrameRef.current=requestAnimationFrame(animate)},delay)}
  const stopIdle=()=>{window.clearTimeout(idleTimerRef.current);window.clearTimeout(idleDirectionTimerRef.current);idleActiveRef.current=false;idleVelocityRef.current={x:0,y:0};idleTargetRef.current={x:0,y:0};infiniteBoardRef.current?.classList.remove('screensaver')}
  const chooseIdleDirection=()=>{if(!idleActiveRef.current)return;const angle=Math.random()*Math.PI*2;const speed=.18+Math.random()*.14;const target={x:Math.cos(angle)*speed,y:Math.sin(angle)*speed};if(Math.abs(idleVelocityRef.current.x)+Math.abs(idleVelocityRef.current.y)<.01)idleVelocityRef.current={x:target.x*.45,y:target.y*.45};idleTargetRef.current=target;idleDirectionTimerRef.current=window.setTimeout(chooseIdleDirection,7000+Math.random()*9000)}
  const scheduleIdle=()=>{window.clearTimeout(idleTimerRef.current);if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;idleTimerRef.current=window.setTimeout(()=>{cancelBoardSnap();idleActiveRef.current=true;infiniteBoardRef.current?.classList.add('screensaver');chooseIdleDirection()},10_000)}
  const normalizeBoardPosition=()=>{const board=infiniteBoardRef.current;if(!board)return;const panelWidth=board.scrollWidth/3;const panelHeight=board.scrollHeight/3;if(board.scrollLeft<panelWidth*.5)board.scrollLeft+=panelWidth;if(board.scrollLeft>panelWidth*1.5)board.scrollLeft-=panelWidth;if(board.scrollTop<panelHeight*.5)board.scrollTop+=panelHeight;if(board.scrollTop>panelHeight*1.5)board.scrollTop-=panelHeight}
  const markBoardActive=()=>{const wasIdle=idleActiveRef.current;stopIdle();cancelBoardSnap();if(wasIdle)normalizeBoardPosition();scheduleIdle()}
  const handleBoardPointerMove=(event:React.PointerEvent<HTMLDivElement>)=>{if(focusMode)return;markBoardActive();const tile=(event.target as Element).closest('.spark-tile');const title=tile?.querySelector('h3')?.textContent;const hovered=title?visibleCards.find(card=>card.title===title):undefined;if(hoveredCardRef.current!==(hovered?.id||null)){hoveredCardRef.current=hovered?.id||null;setHoveredCardId(hovered?.id||null)}const rect=event.currentTarget.getBoundingClientRect();const nx=(event.clientX-rect.left)/rect.width-.5;const ny=(event.clientY-rect.top)/rect.height-.5;const dead=.28;const velocity=(value:number)=>Math.abs(value)<dead?0:Math.sign(value)*Math.min(1.15,(Math.abs(value)-dead)*5.2);const next={x:velocity(nx),y:velocity(ny)};panVelocityRef.current=next;const panning=!!(next.x||next.y);infiniteBoardRef.current?.classList.toggle('auto-panning',panning);if(!panning)queueBoardSnap()}
  const stopBoardPan=()=>{panVelocityRef.current={x:0,y:0};infiniteBoardRef.current?.classList.remove('auto-panning');queueBoardSnap();hoveredCardRef.current=null;setHoveredCardId(null)}

  useEffect(()=>{scheduleIdle();return()=>{stopIdle();cancelBoardSnap()}},[])

  const completeCard = async (event: { stopPropagation: () => void } | undefined, card: Card) => {
    event?.stopPropagation()
    if (card.status === 'done') return
    const response = await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', section: 'archive' }),
    })
    if (!response.ok) return
    const updated = await response.json()
    onCardCompleted(updated)
    if (focusCard?.id === card.id) setFocusMode(false)
    playRewardSound()
    setReward(card.title)
    window.setTimeout(() => setReward(null), 2600)
  }

  useEffect(()=>{const board=infiniteBoardRef.current;if(!board)return;let initialized=false;const centerWhenReady=()=>{if(initialized||board.scrollWidth<board.clientWidth*2.5||board.scrollHeight<board.clientHeight*2.5)return;initialized=true;board.scrollLeft=board.scrollWidth/3;board.scrollTop=board.scrollHeight/3;observer.disconnect()};const observer=new ResizeObserver(centerWhenReady);observer.observe(board);const track=board.querySelector('.infinite-track');if(track)observer.observe(track);const frame=requestAnimationFrame(centerWhenReady);const readyTimer=window.setTimeout(centerWhenReady,350);const recenter=()=>{if(!initialized)return;const panelWidth=board.scrollWidth/3;const panelHeight=board.scrollHeight/3;if(board.scrollLeft<panelWidth*.02)board.scrollLeft+=panelWidth;if(board.scrollLeft>panelWidth*1.98)board.scrollLeft-=panelWidth;if(board.scrollTop<panelHeight*.02)board.scrollTop+=panelHeight;if(board.scrollTop>panelHeight*1.98)board.scrollTop-=panelHeight};const handleWheel=()=>{markBoardActive();panVelocityRef.current={x:0,y:0};board.classList.remove('auto-panning');queueBoardSnap(720)};board.addEventListener('scroll',recenter,{passive:true});board.addEventListener('wheel',handleWheel,{passive:true});return()=>{cancelAnimationFrame(frame);window.clearTimeout(readyTimer);observer.disconnect();window.clearTimeout(snapTimerRef.current);board.removeEventListener('scroll',recenter);board.removeEventListener('wheel',handleWheel)}},[])
  useEffect(()=>{const timer=window.setTimeout(()=>{const board=infiniteBoardRef.current;if(!board)return;cancelBoardSnap();board.scrollLeft=board.scrollWidth/3;board.scrollTop=board.scrollHeight/3},450);return()=>window.clearTimeout(timer)},[])
  useEffect(()=>{const board=infiniteBoardRef.current;if(!board)return;let done=false;const centerAtFinalSize=()=>{if(done||board.clientHeight<300||board.scrollHeight<board.clientHeight*2.5)return;done=true;cancelBoardSnap();board.scrollLeft=board.scrollWidth/3;board.scrollTop=board.scrollHeight/3;observer.disconnect()};const observer=new ResizeObserver(centerAtFinalSize);observer.observe(board);const track=board.querySelector('.infinite-track');if(track)observer.observe(track);const fallback=window.setTimeout(centerAtFinalSize,1200);return()=>{observer.disconnect();window.clearTimeout(fallback)}},[])
  useEffect(()=>{let attempts=0;const interval=window.setInterval(()=>{attempts+=1;const board=infiniteBoardRef.current;if(board&&board.clientHeight>=300&&board.scrollHeight>=board.clientHeight*2.5&&board.scrollTop<100){cancelBoardSnap();board.scrollLeft=board.scrollWidth/3;board.scrollTop=board.scrollHeight/3}if(attempts>=20||(board&&board.scrollTop>=100))window.clearInterval(interval)},100);return()=>window.clearInterval(interval)},[])

  const renderMosaic=(copyIndex:number)=><section className="infinite-copy" key={copyIndex} aria-label={copyIndex===4?'Unendliche Ideenübersicht':undefined} aria-hidden={copyIndex===4?undefined:true}>
    <div className="spark-mosaic">
      <DailyTransitTile data={transit} loading={liveLoading&&!transit} error={!transit?liveError:null} order={mixedOrder(0)}/>
      <DailyWeatherTile data={weather} loading={liveLoading&&!weather} error={!weather?liveError:null} order={mixedOrder(1)}/>
      {visibleCards.map((card,index)=>{
        const baseShape=card.thumbnail?(imageShapes[card.id]||'standard'):tileShapes[index%tileShapes.length]
        const shape=!card.thumbnail&&card.title.length>32&&baseShape==='standard'?'wide':baseShape
        const titleSize=card.title.length>70?'title-very-long':card.title.length>34?'title-long':''
        const urgency=urgencyFor(card,now)
        return <article key={`${copyIndex}-${card.id}`} className={`spark-tile ${shape} priority-${urgency.level} poster-${index%6} ${titleSize} ${card.thumbnail?'has-image':''} ${card.id===selectedCardId?'selected':''}`} style={{order:mixedOrder(index+2)}} onClick={()=>onSelectCard(card)} tabIndex={copyIndex===4?0:-1} onKeyDown={event=>{if(copyIndex===4&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onSelectCard(card)}}}><span className="spark-dot-halo" aria-hidden="true"/>{card.thumbnail?<img src={card.thumbnail} alt="" onLoad={event=>{const ratio=event.currentTarget.naturalWidth/event.currentTarget.naturalHeight;const next=ratio>1.22?'wide':ratio<.82?'portrait':'standard';setImageShapes(current=>current[card.id]===next?current:{...current,[card.id]:next})}}/>:<div className={`spark-art art-${index%5}`} aria-hidden="true"><span>{index%3===0?'✦':index%3===1?'◐':'↗'}</span></div>}<div className="spark-tile-copy"><span className="spark-kind">{urgency.level==='normal'?(card.dueDate?'STEHT AN':index===0?'WIEDERENTDECKT':card.section.toUpperCase()):urgency.label}</span><h3>{card.title}</h3>{card.nextStep&&<p>NEXT · {card.nextStep}</p>}<div className="spark-tile-footer"><span>{urgency.label}</span><div>{card.links?.[0]&&<a className="spark-direct-link" href={card.links[0].url} target="_blank" rel="noreferrer" onClick={event=>event.stopPropagation()} title={card.links[0].title||'Link öffnen'}>↗</a>}{card.status!=='done'&&card.status!=='archived'&&<button onClick={event=>completeCard(event,card)} title="Als erledigt markieren">✓</button>}</div></div></div></article>
      })}
      <a className="spark-tile inspiration-feed" style={{order:mixedOrder(visibleCards.length+2)}} href="https://www.midjourney.com/explore?tab=top" target="_blank" rel="noreferrer" aria-label="Midjourney Explore öffnen" tabIndex={copyIndex===4?0:-1}><div className="feed-grid">{Array.from({length:6}).map((_,index)=><i key={index} className={`feed-placeholder feed-${index}`}/>)}</div><div className="feed-label"><span>MIDJOURNEY EXPLORE</span><strong>Top öffnen ↗</strong></div></a>
    </div>
  </section>

  return (
    <div className="daily-spark" ref={dailySparkRef} onPointerMove={handleBoardPointerMove} onPointerLeave={stopBoardPan}>
      <div className="spark-stats">
        <div className="spark-clock"><span>{new Intl.DateTimeFormat('de-AT',{timeZone:'Europe/Vienna',weekday:'short',day:'2-digit',month:'short'}).format(now).toUpperCase()}</span><strong>{new Intl.DateTimeFormat('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'}).format(now)}</strong></div>
        <div><span>HEUTE</span><strong>{doneToday} erledigt</strong></div>
        <div><span>DIESE WOCHE</span><strong>{doneWeek} erledigt</strong></div>
        <div><span>NOCH OFFEN</span><strong>{open} Aufgaben</strong></div>
        <div className="streak"><span>CREATIVE STREAK</span><strong>⚡ Weiter so</strong></div>
        <button className="shuffle-button" onClick={() => {setShuffleSeed(Date.now());setLiveLoading(true);refreshLive()}}>✦ Neu mischen</button>
        <button className="focus-button" onClick={()=>setFocusMode(true)} aria-label="Fokusmodus öffnen"><kbd>F</kbd> Fokus</button>
        <button className="fullscreen-button" onClick={()=>isFullscreen?document.exitFullscreen():dailySparkRef.current?.requestFullscreen()} aria-label={isFullscreen?'Vollbild verlassen':'Vollbild öffnen'} title={isFullscreen?'Vollbild verlassen':'Vollbild öffnen'}>{isFullscreen?'↙':'⛶'} <span>{isFullscreen?'Zurück':'Vollbild'}</span></button>
      </div>

      <div className="infinite-board" ref={infiniteBoardRef}>
        <div className="infinite-track">{Array.from({length:9}).map((_,index)=>renderMosaic(index))}</div>
      </div>

      {focusMode && <div className="focus-mode" role="dialog" aria-modal="true" aria-label="Fokusmodus">
        <button className="focus-close" onClick={()=>setFocusMode(false)} aria-label="Fokusmodus schließen">×</button>
        {focusCard ? <article className={`focus-card ${focusCard.thumbnail?'has-image':''} priority-${urgencyFor(focusCard,now).level}`}>
          {focusCard.thumbnail && <figure><img src={focusCard.thumbnail} alt={focusCard.title}/></figure>}
          <div className="focus-card-content">
            <span className="focus-priority">{urgencyFor(focusCard,now).label}</span>
            <h2>{focusCard.title}</h2>
            <dl className="focus-metadata">
              <div><dt>FÄLLIG</dt><dd>{focusCard.dueDate?new Date(focusCard.dueDate).toLocaleDateString('de-AT',{weekday:'long',day:'2-digit',month:'long'}):'Kein Datum'}</dd></div>
              <div><dt>WICHTIGKEIT</dt><dd>{urgencyFor(focusCard,now).label}</dd></div>
              <div><dt>STATUS</dt><dd>{focusCard.status}</dd></div>
            </dl>
            <section><span>NOTIZ</span><p className="focus-description">{focusCard.description||'Keine Notiz hinterlegt.'}</p></section>
            <section><span>NÄCHSTER SCHRITT</span><p>{focusCard.nextStep||'Noch kein nächster Schritt definiert.'}</p></section>
            {focusCard.links && focusCard.links.length > 0 && <nav className="focus-links" aria-label="Links">{focusCard.links.map(link=><a key={link.id} href={link.url} target="_blank" rel="noreferrer">{link.title||new URL(link.url).hostname} ↗</a>)}</nav>}
            <div className="focus-actions"><button className="focus-done" onClick={()=>completeCard(undefined,focusCard)}>✓ Erledigt</button></div>
          </div>
        </article> : <p className="focus-empty">Alles erledigt. Zeit für eine neue Idee.</p>}
      </div>}


      <div className={`reward-toast ${reward ? 'show' : ''}`} role="status" aria-live="polite">
        <span>✦</span><div><small>ERLEDIGT · +25 XP</small><strong>{reward}</strong><p>Momentum aufgebaut!</p></div>
      </div>
    </div>
  )
}
