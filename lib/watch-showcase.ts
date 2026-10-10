export type ClockMode = 'live' | 'fixed' | 'day'

export type ShowcaseOptions = {
  face: string
  mode?: ClockMode
  time?: string
  speed?: number
  cycleThemes?: boolean
  themeInterval?: number
  timeZone?: string
}

export type Theme = {
  id: string
  label: string
  configuration: Record<string, string>
  background: string
  bezel: string
}

export type FaceManifest = {
  name: string
  assets: Record<string, string>
  strings: Record<string, string>
  themes: Theme[]
}

export type Clock = {
  mode: ClockMode
  timestamp: number
  anchor: number
  speed: number
  paused: boolean
}

const formatters = new Map<string, Intl.DateTimeFormat>()

export function clockParts(timestamp: number, timeZone: string) {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    })
    formatters.set(timeZone, formatter)
  }
  const parts = Object.fromEntries(formatter.formatToParts(timestamp).map(p => [p.type, p.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}:${parts.second}` }
}

export function zonedTimestamp(date: string, time: string, timeZone: string) {
  const target = Date.parse(`${date}T${time.length === 5 ? `${time}:00` : time}Z`)
  if (!Number.isFinite(target)) throw new Error('Choose a valid date and time.')
  let instant = target
  for (let i = 0; i < 4; i++) {
    const parts = clockParts(instant, timeZone)
    const represented = Date.parse(`${parts.date}T${parts.time}Z`)
    const delta = target - represented
    if (delta === 0) return instant
    instant += delta
  }
  throw new Error('That local time does not exist on this date. Choose another time.')
}

export function dayBounds(date: string, timeZone: string) {
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return [zonedTimestamp(date, '00:00', timeZone), zonedTimestamp(next.toISOString().slice(0, 10), '00:00', timeZone)] as const
}

export function clockTimestamp(clock: Clock, now: number, bounds: readonly [number, number]) {
  if (clock.paused || clock.mode === 'fixed') return clock.timestamp
  if (clock.mode === 'live') return now
  const duration = bounds[1] - bounds[0]
  const offset = clock.timestamp - bounds[0] + (now - clock.anchor) * clock.speed
  return bounds[0] + ((offset % duration) + duration) % duration
}

export function parseShowcase(value: string): ShowcaseOptions {
  const config = JSON.parse(value)
  if (!config || typeof config.face !== 'string' || !/^[a-z][a-z0-9-]*$/.test(config.face)) throw new Error('Invalid showcase face.')
  if (config.mode && !['live', 'fixed', 'day'].includes(config.mode)) throw new Error('Invalid showcase clock mode.')
  if (config.speed !== undefined && (!Number.isFinite(config.speed) || config.speed <= 0)) throw new Error('Invalid playback speed.')
  if (config.themeInterval !== undefined && (!Number.isFinite(config.themeInterval) || config.themeInterval < 2)) throw new Error('Theme intervals must be at least two seconds.')
  if (config.time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(config.time)) throw new Error('Invalid showcase time.')
  if (config.timeZone) new Intl.DateTimeFormat('en-US', { timeZone: config.timeZone })
  return config
}
