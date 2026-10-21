import { test, expect } from '@playwright/test'
import { clockParts, clockTimestamp, dayBounds, zonedTimestamp } from '../lib/watch-showcase'

test('Pacific clock uses the correct instant and handles daylight saving days', () => {
  const summer = zonedTimestamp('2026-06-21', '12:00', 'America/Los_Angeles')
  expect(new Date(summer).toISOString()).toBe('2026-06-21T19:00:00.000Z')
  expect(clockParts(summer, 'America/Los_Angeles').time).toBe('12:00:00')
  const spring = dayBounds('2026-03-08', 'America/Los_Angeles')
  const fall = dayBounds('2026-11-01', 'America/Los_Angeles')
  expect(spring[1] - spring[0]).toBe(23 * 3600000)
  expect(fall[1] - fall[0]).toBe(25 * 3600000)
  expect(() => zonedTimestamp('2026-03-08', '02:30', 'America/Los_Angeles')).toThrow('does not exist')
  const bounds = dayBounds('2026-06-21', 'America/Los_Angeles')
  const clock = { mode: 'day' as const, timestamp: bounds[0], anchor: 0, speed: 1440, paused: false }
  expect(clockTimestamp(clock, 30000, bounds)).toBe(bounds[0] + 12 * 3600000)
  expect(clockTimestamp(clock, 60000, bounds)).toBe(bounds[0])
  expect(clockTimestamp({ ...clock, paused: true }, 30000, bounds)).toBe(bounds[0])
})

test('authored Sundial playback moves and the page has no visitor controls', async ({ page }) => {
  await page.goto('/watches')
  const card = page.locator('[data-showcase="sundial-ii"]')
  await card.scrollIntoViewIfNeeded()
  await expect(card).toHaveAttribute('data-ready', 'true', { timeout: 30000 })
  const frame = () => card.locator('canvas').evaluate(c => (c as HTMLCanvasElement).toDataURL())
  const initial = await frame()
  await expect.poll(frame).not.toBe(initial)
  await expect(page.locator('[data-showcase] input, [data-showcase] select, [data-showcase] button')).toHaveCount(0)
})

test('authored theme rotation updates the label and surrounding frame', async ({ page }) => {
  await page.goto('/watches')
  const card = page.locator('[data-showcase="radial-moire"]')
  await card.scrollIntoViewIfNeeded()
  await expect(card).toHaveAttribute('data-ready', 'true', { timeout: 30000 })
  const title = card.locator('[aria-live="polite"]')
  const label = await title.textContent()
  const style = await card.getByTestId('watch-stage').getAttribute('style')
  await expect(title).not.toHaveText(label!, { timeout: 12000 })
  await expect(card.getByTestId('watch-stage')).not.toHaveAttribute('style', style!)
  await expect(card.getByText(/A different theme every 8 seconds/)).toBeVisible()
})

for (const fallback of [false, true]) {
  test(`authored SplitFlap schedule shuffles and settles${fallback ? ' without ImageDecoder' : ''}`, async ({ page }) => {
    if (fallback) await page.addInitScript(() => { Object.defineProperty(window, 'ImageDecoder', { value: undefined, configurable: true }) })
    await page.goto('/watches')
    const card = page.locator('[data-showcase="split-flap"]')
    await card.scrollIntoViewIfNeeded()
    await expect(card).toHaveAttribute('data-ready', 'true', { timeout: 30000 })
    await page.waitForTimeout(100)
    const frame = () => card.locator('canvas').evaluate(c => (c as HTMLCanvasElement).toDataURL())
    const settled = await frame()
    for (let replay = 0; replay < 2; replay++) {
      await expect(card).toHaveAttribute('data-replaying', 'true', { timeout: 12000 })
      await expect.poll(frame).not.toBe(settled)
      await expect(card).toHaveAttribute('data-replaying', 'false', { timeout: 5000 })
      await expect.poll(frame).toBe(settled)
    }
    await expect(card.getByRole('alert')).toHaveCount(0)
  })
}

test('mobile showcases stay still with reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', colorScheme: 'dark' })
  const page = await context.newPage()
  await page.goto('/watches')
  for (const face of ['sundial-ii', 'radial-moire', 'split-flap']) {
    const card = page.locator(`[data-showcase="${face}"]`)
    await card.scrollIntoViewIfNeeded()
    await expect(card).toHaveAttribute('data-ready', 'true', { timeout: 30000 })
    await page.waitForTimeout(200)
    const frame = await card.locator('canvas').evaluate(c => (c as HTMLCanvasElement).toDataURL())
    await page.waitForTimeout(1300)
    expect(await card.locator('canvas').evaluate(c => (c as HTMLCanvasElement).toDataURL())).toBe(frame)
    await expect(card).toHaveAttribute('data-replaying', 'false')
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await context.close()
})
