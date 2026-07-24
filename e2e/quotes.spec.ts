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

  test('navigates to a quote detail page', async ({ page }) => {
    await page.goto('/quotes')
    const firstCard = page.locator('a[href^="/quote/"]').first()
    const href = await firstCard.getAttribute('href')
    await firstCard.click()
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'))
    await expect(page.getByRole('link', { name: '← Back to all quotes' })).toBeVisible()
  })

  test('/quote redirects to /quotes', async ({ page }) => {
    await page.goto('/quote')
    await expect(page).toHaveURL(/\/quotes$/)
  })
})
