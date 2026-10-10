import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { Clock, FaceManifest, ShowcaseOptions, clockParts, clockTimestamp, dayBounds, zonedTimestamp } from '../lib/watch-showcase'
import type { RenderResult } from '../lib/vendor/wff-web'
import styles from './watch-showcase.module.css'

type LoadedFace = { manifest: FaceManifest; xml: string; assets: Map<string, ArrayBuffer> }

export default function WatchShowcase({ face, mode: initialMode = 'live', time = '10:10', speed: initialSpeed = 1440, cycleThemes = false, themeInterval = 8, timeZone = 'America/Los_Angeles', wakeDelay, wakeInterval }: ShowcaseOptions) {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<RenderResult | null>(null)
  const replayPending = useRef(false)
  const [replayStarted, setReplayStarted] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState<LoadedFace | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [date, setDate] = useState('')
  const [clock, setClock] = useState<Clock | null>(null)
  const [themeIndex, setThemeIndex] = useState(0)
  const [cycling, setCycling] = useState(cycleThemes)
  const [reducedMotion, setReducedMotion] = useState(true)
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
    setReducedMotion(reducedMotion)
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
        timeZone, animate: false, elapsedMs: 0, ambientTransitionDurationMs: 0, configuration: loaded.manifest.themes[0]?.configuration,
      })
      if (cancelled) { result.stop(); return }
      if (loaded.manifest.wakeAnimationMs) await result.update({ elapsedMs: 5000 + performance.now() })
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
    const fps = face === 'sundial-ii' ? 12 : 30
    const draw = async (elapsed: number) => {
      if (cancelled) return
      if (elapsed - lastFrame < 1000 / fps) { frame = requestAnimationFrame(draw); return }
      lastFrame = elapsed
      const timestamp = clockTimestamp(clock, Date.now(), bounds)
      try {
        const animationElapsed = loaded?.manifest.wakeAnimationMs ? 5000 + performance.now() : timestamp - bounds[0]
        if (replayPending.current) {
          replayPending.current = false
          await renderer.current?.update({ visible: false, elapsedMs: animationElapsed })
        }
        await renderer.current?.update({
          visible: true, time: new Date(timestamp), elapsedMs: animationElapsed,
          configuration: theme?.configuration,
        })
        canvas.current?.setAttribute('aria-label', `${loaded?.manifest.name ?? face} watch face`)
        if (cancelled) return
        if (clock.mode === 'live' && !clock.paused) setDate(clockParts(timestamp, timeZone).date)
        const replaying = replayStarted !== null && performance.now() - replayStarted < (loaded?.manifest.wakeAnimationMs ?? 0)
        if (replaying || (!clock.paused && clock.mode !== 'fixed')) frame = requestAnimationFrame(draw)
        else if (replayStarted !== null) setReplayStarted(null)
      } catch (e) {
        if (!cancelled) setError(`Preview unavailable: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    frame = requestAnimationFrame(draw)
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [ready, clock, active, bounds, theme, timeZone, face, loaded, replayStarted])

  useEffect(() => {
    if (!cycling || !active || !ready || !loaded || loaded.manifest.themes.length < 2) return
    const timer = window.setInterval(() => setThemeIndex(i => (i + 1) % loaded.manifest.themes.length), themeInterval * 1000)
    return () => window.clearInterval(timer)
  }, [cycling, active, ready, loaded, themeInterval])

  useEffect(() => {
    if (!active || !ready || reducedMotion || !loaded?.manifest.wakeAnimationMs || (wakeDelay === undefined && wakeInterval === undefined)) return
    let repeat: number | undefined
    const fire = () => { replayPending.current = true; setReplayStarted(performance.now()) }
    const first = window.setTimeout(() => {
      fire()
      if (wakeInterval !== undefined) repeat = window.setInterval(fire, Math.max(wakeInterval * 1000, loaded.manifest.wakeAnimationMs! + 100))
    }, (wakeDelay ?? wakeInterval ?? 0) * 1000)
    return () => { window.clearTimeout(first); window.clearInterval(repeat) }
  }, [active, ready, reducedMotion, loaded, wakeDelay, wakeInterval])

  const name = loaded?.manifest.name ?? face.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
  const stage = { '--stage': theme?.background ?? '#e5e6df', '--bezel': theme?.bezel ?? '#52615b' } as CSSProperties
  return (
    <section ref={root} className={styles.showcase} aria-label={`${name} showcase`} data-showcase={face} data-ready={ready} data-replaying={replayStarted !== null}>
      <div className={styles.stage} style={stage} data-testid="watch-stage">
        <div className={styles.bezel}>
          <img src={`/watches/${face}.webp`} alt={`${name} preview`} hidden={ready && !error} />
          <canvas ref={canvas} width={450} height={450} role="img" aria-label={`${name} watch face`} hidden={!ready || !!error} />
        </div>
      </div>
      <div className={styles.title} aria-live="polite">{theme?.label ?? name}</div>
      {cycleThemes && loaded && loaded.manifest.themes.length > 1 ? <p className={styles.note}>Theme showcase · {theme?.label}. {reducedMotion ? 'Showing a still theme.' : `A different theme every ${themeInterval} seconds.`} Theme changes are separate from the watch’s own motion.</p> : null}
      {error ? <p className={styles.error} role="alert">{error} <a href={`https://patrickauld.github.io/watches/faces/${face}/`}>Open the live gallery</a></p> : null}
      <p className={styles.note}>Browser simulation.</p>
    </section>
  )
}
