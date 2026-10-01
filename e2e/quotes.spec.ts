import { test, expect } from '@playwright/test'

test.describe('Quotes page', () => {
  test('has expected title and heading', async ({ page }) => {
    await page.goto('/quotes')
    await expect(page).toHaveTitle('Quotes')
    await expect(page.getByRole('heading', { name: 'Quotes' })).toBeVisible()
  })

  test('lists a known quote', async ({ page }) => {
    await page.goto('/quotes')
    await expect(page.getByText('Done is better than perfect.')).toBeVisible()
  })

  test('fills the mobile viewport and uses the available width for quote cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/quotes')
    const pageSurface = page.locator('#__next > div').first()
    const surfaceBox = await pageSurface.boundingBox()
    expect(surfaceBox?.x).toBe(0)
    expect(surfaceBox?.width).toBe(390)
    const firstQuoteCard = page.locator('a[href^="/quote/"] blockquote').nth(1)
    const box = await firstQuoteCard.boundingBox()
    expect(box?.width).toBeGreaterThan(330)
  })

  test('navigates to a quote detail page', async ({ page }) => {
    await page.goto('/quotes')
    const firstCard = page.locator('a[href^="/quote/"]').first()
    const href = await firstCard.getAttribute('href')
    await firstCard.click()
    await expect(page).toHaveURL((url) => url.pathname === href)
    await expect(page.getByRole('link', { name: '← Back to all quotes' })).toBeVisible()
  })

  test('/quote redirects to /quotes', async ({ page }) => {
    await page.goto('/quote')
    await expect(page).toHaveURL((url) => url.pathname === '/quotes')
  })
})
