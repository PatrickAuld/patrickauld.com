import { CSSProperties, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Clock, ClockMode, FaceManifest, ShowcaseOptions, clockParts, clockTimestamp, dayBounds, zonedTimestamp } from '../lib/watch-showcase'
import type { RenderResult } from '../lib/vendor/wff-web'
import styles from './watch-showcase.module.css'

type LoadedFace = { manifest: FaceManifest; xml: string; assets: Map<string, ArrayBuffer> }

export default function WatchShowcase({ face, mode: initialMode = 'live', time = '10:10', speed: initialSpeed = 1440, cycleThemes = false, themeInterval = 8, timeZone = 'America/Los_Angeles' }: ShowcaseOptions) {
  const id = useId()
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<RenderResult | null>(null)
  const clockRef = useRef<Clock | null>(null)
  const clockVersion = useRef(0)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState<LoadedFace | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [date, setDate] = useState('')
  const [clock, setClock] = useState<Clock | null>(null)
  const [readout, setReadout] = useState({ time: time.length === 5 ? `${time}:00` : time, timestamp: 0 })
  const [themeIndex, setThemeIndex] = useState(0)
  const [cycling, setCycling] = useState(cycleThemes)
  const [interval, setIntervalSeconds] = useState(themeInterval)
  const [ambient, setAmbient] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const bounds = useMemo(() => date ? dayBounds(date, timeZone) : [0, 86400000] as const, [date, timeZone])
  const theme = loaded?.manifest.themes[themeIndex]
  const active = visible && pageVisible

  useEffect(() => {
    const now = Date.now()
    const today = clockParts(now, timeZone).date
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setDate(today)
    const initial = { mode: initialMode, timestamp: initialMode === 'live' ? now : zonedTimestamp(today, time, timeZone), anchor: now, speed: initialSpeed, paused: reducedMotion }
    clockRef.current = initial
    setClock(initial)
    if (reducedMotion) setCycling(false)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '150px' })
    if (root.current) observer.observe(root.current)
    const onVisibility = () => setPageVisible(!document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [initialMode, initialSpeed, time, timeZone])

  useEffect(() => {
    if (!visible || loaded) return
    const controller = new AbortController()
    const base = `/watches/faces/${face}`
    const fetchFile = async (url: string) => {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) throw new Error('The interactive preview could not be loaded.')
      return response
    }
    void (async () => {
      const [manifestResponse, xmlResponse] = await Promise.all([fetchFile(`${base}/manifest.json`), fetchFile(`${base}/watchface.xml`)])
      const manifest: FaceManifest = await manifestResponse.json()
      const [xml, assets] = await Promise.all([
        xmlResponse.text(),
        Promise.all(Object.entries(manifest.assets).map(async ([name, filename]) => [name, await (await fetchFile(`${base}/assets/${filename}`)).arrayBuffer()] as const)),
      ])
      if (!controller.signal.aborted) setLoaded({ manifest, xml, assets: new Map(assets) })
    })().catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [face, visible, loaded])

  useEffect(() => {
    if (!loaded || !canvas.current) return
    let cancelled = false
    let result: RenderResult | undefined
    const element = canvas.current
    void import('../lib/vendor/wff-web').then(async ({ renderWatchFace }) => {
      result = await renderWatchFace(element, {
        xml: loaded.xml, assets: loaded.assets, strings: loaded.manifest.strings,
        width: 450, height: 450, time: new Date(zonedTimestamp(clockParts(Date.now(), timeZone).date, time, timeZone)),
        timeZone, animate: false, ambientTransitionDurationMs: 0, configuration: loaded.manifest.themes[0]?.configuration,
      })
      if (cancelled) { result.stop(); return }
      renderer.current = result
      setReady(true)
    }).catch(e => { if (!cancelled) setError(`Preview unavailable: ${e.message}`) })
    return () => { cancelled = true; result?.stop(); renderer.current = null }
  }, [loaded, timeZone, time])

  useEffect(() => {
    if (!ready || !clock || !active) return
    let cancelled = false
    let frame = 0
    let lastFrame = -Infinity
    let lastReadout = -Infinity
    const fps = face === 'sundial-ii' ? 12 : 30
    const draw = async (elapsed: number) => {
      if (cancelled) return
      if (elapsed - lastFrame < 1000 / fps) { frame = requestAnimationFrame(draw); return }
      lastFrame = elapsed
      const timestamp = clockTimestamp(clock, Date.now(), bounds)
      const version = clockVersion.current
      try {
        await renderer.current?.update({
          time: new Date(timestamp), elapsedMs: timestamp - bounds[0], ambient,
          configuration: theme?.configuration,
        })
        canvas.current?.setAttribute('aria-label', `${loaded?.manifest.name ?? face} watch face`)
        if (cancelled || version !== clockVersion.current) return
        if (elapsed - lastReadout > 200 || clock.paused || clock.mode === 'fixed') {
          const parts = clockParts(timestamp, timeZone)
          setReadout({ ...parts, timestamp })
          if (clock.mode === 'live' && !clock.paused) setDate(parts.date)
          lastReadout = elapsed
        }
        if (!clock.paused && clock.mode !== 'fixed') frame = requestAnimationFrame(draw)
      } catch (e) {
        if (!cancelled) setError(`Preview unavailable: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    frame = requestAnimationFrame(draw)
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [ready, clock, active, bounds, ambient, theme, timeZone, face, loaded])

  useEffect(() => {
    if (!cycling || !active || !ready || !loaded || loaded.manifest.themes.length < 2) return
    const timer = window.setInterval(() => setThemeIndex(i => (i + 1) % loaded.manifest.themes.length), interval * 1000)
    return () => window.clearInterval(timer)
  }, [cycling, active, ready, loaded, interval])

  const updateClock = (changes: Partial<Clock>) => {
    const previous = clockRef.current
    if (!previous) return
    const now = Date.now()
    const next = { ...previous, timestamp: clockTimestamp(previous, now, bounds), anchor: now, ...changes }
    clockVersion.current++
    clockRef.current = next
    setClock(next)
    const timestamp = clockTimestamp(next, now, bounds)
    setReadout({ ...clockParts(timestamp, timeZone), timestamp })
    setError('')
  }

  const changeTime = (nextDate: string, nextTime: string) => {
    if (!nextDate || !nextTime) return
    try {
      const timestamp = zonedTimestamp(nextDate, nextTime, timeZone)
      setDate(nextDate)
      updateClock({ timestamp, mode: clockRef.current?.mode === 'live' ? 'fixed' : clockRef.current?.mode, paused: true })
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }

  const changeMode = (mode: ClockMode) => {
    const now = Date.now()
    if (mode === 'live') setDate(clockParts(now, timeZone).date)
    updateClock({ mode, timestamp: mode === 'live' ? now : clockRef.current ? clockTimestamp(clockRef.current, now, bounds) : now, paused: false })
  }

  const name = loaded?.manifest.name ?? face.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
  const stage = { '--stage': theme?.background ?? '#e5e6df', '--bezel': theme?.bezel ?? '#52615b' } as CSSProperties
  const progress = readout.timestamp ? Math.max(0, Math.min((bounds[1] - bounds[0]) / 1000 - 1, (readout.timestamp - bounds[0]) / 1000)) : 0
  const displayMode = !clock ? 'Loading preview' : clock.mode === 'fixed' ? 'Fixed time · motion frozen' : clock.paused ? 'Paused · motion frozen' : clock.mode === 'live' ? 'Current time' : `${clock.speed.toLocaleString()}× time · a day in ${Math.round((bounds[1] - bounds[0]) / clock.speed / 1000)} seconds`

  return (
    <section ref={root} className={styles.showcase} aria-label={`${name} interactive showcase`} data-showcase={face}>
      <div className={styles.stage} style={stage} data-testid="watch-stage">
        <div className={styles.bezel}>
          <img src={`/watches/${face}.webp`} alt={`${name} preview`} hidden={ready && !error} />
          <canvas ref={canvas} width={450} height={450} role="img" aria-label={`${name} watch face`} hidden={!ready || !!error} />
        </div>
      </div>
      <div className={styles.title} aria-live="polite">{theme?.label ?? name}</div>
      <p className={styles.note}>{cycling ? `Theme showcase · a different theme every ${interval} seconds.` : 'Selected theme.'} Theme changes also recolor the surrounding stage and bezel; they are separate from the watch’s own motion.</p>
      {error ? <p className={styles.error} role="alert">{error} <a href={`https://patrickauld.github.io/watches/faces/${face}/`}>Open the live gallery</a></p> : null}
      <fieldset disabled={!ready || !clock}>
        <legend className="sr-only">{name} preview controls</legend>
        <div className={styles.readout}>
          <output aria-label="Displayed time">{readout.time}</output>
          <span>{displayMode}</span>
        </div>
        <label htmlFor={`${id}-scrub`}>Scrub through the day</label>
        <input id={`${id}-scrub`} className={styles.slider} type="range" min={0} max={(bounds[1] - bounds[0]) / 1000 - 1} step={1} value={progress} aria-valuetext={readout.time} onChange={e => updateClock({ timestamp: bounds[0] + Number(e.target.value) * 1000, mode: clock?.mode === 'day' ? 'day' : 'fixed', paused: true })} />
        <div className={styles.controls}>
          <label>Clock mode<select value={clock?.mode ?? initialMode} onChange={e => changeMode(e.target.value as ClockMode)}>
            <option value="live">Current time</option><option value="fixed">Fixed time</option><option value="day">Day playback</option>
          </select></label>
          <button type="button" disabled={clock?.mode === 'fixed'} onClick={() => updateClock({ paused: !clock?.paused })}>{clock?.paused ? 'Play' : 'Pause'}</button>
          <label>Set time<input type="time" step={1} value={readout.time} onChange={e => changeTime(date, e.target.value)} /></label>
          <label>Date<input type="date" value={date} onChange={e => changeTime(e.target.value, readout.time)} /></label>
          {clock?.mode === 'day' ? <label>Playback speed<select value={clock.speed} onChange={e => updateClock({ speed: Number(e.target.value) })}>{[...new Set([60, 360, 1440, 2880, initialSpeed])].sort((a, b) => a - b).map(value => <option key={value} value={value}>{value}×</option>)}</select></label> : null}
        </div>
        <p className={styles.note}>Clock location: {timeZone === 'America/Los_Angeles' ? 'Alameda, California (Pacific time)' : timeZone}. Scrubbing freezes the watch. Day playback resumes with Play; Current time returns to now.</p>
        <div className={styles.controls}>
          {loaded && loaded.manifest.themes.length > 1 ? <>
            <label>Theme<select aria-label="Theme" value={themeIndex} onChange={e => { setThemeIndex(Number(e.target.value)); setCycling(false) }}>{loaded.manifest.themes.map((option, i) => <option key={option.id} value={i}>{option.label}</option>)}</select></label>
            <label className={styles.check}><input type="checkbox" checked={cycling} onChange={e => setCycling(e.target.checked)} />Rotate themes</label>
            <label>Theme interval<select value={interval} onChange={e => setIntervalSeconds(Number(e.target.value))}>{[...new Set([4, 8, 12, interval])].sort((a, b) => a - b).map(value => <option key={value} value={value}>{value} seconds</option>)}</select></label>
          </> : null}
          <label className={styles.check}><input type="checkbox" checked={ambient} onChange={e => setAmbient(e.target.checked)} />Ambient display</label>
        </div>
      </fieldset>
      <p className={styles.note}>Interactive browser simulation.</p>
    </section>
  )
}
