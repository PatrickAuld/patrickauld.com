import { test, expect } from '@playwright/test'

test.describe('Quotes page', () => {
  test('has expected title and heading', async ({ page }) => {
    await page.goto('/quotes')
    await expect(page).toHaveTitle('Quotes')
    await expect(page.getByRole('heading', { name: 'Quotes' })).toBeVisible()
  })

  test('lists a known quote', async ({ page }) => {
    await page.goto('/quotes')
    await expect(page.getByText('Done is better than perfect.').first()).toBeVisible()
  })

  for (const width of [320, 390, 430, 768, 1280]) {
    for (const theme of ['light', 'dark']) {
      test(`matches README layout at ${width}px in ${theme} mode`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 })
        await page.addInitScript((theme) => localStorage.setItem('theme', theme), theme)
        const measure = async () => page.locator('article').evaluate((article) => {
          const heading = article.querySelector('h1')!
          const content = article.children[1]
          const paragraph = content.querySelector('p')!
          const box = content.getBoundingClientRect()
          return {
            x: box.x,
            width: box.width,
            headingY: heading.getBoundingClientRect().y,
            headingSize: getComputedStyle(heading).fontSize,
            fontSize: getComputedStyle(paragraph).fontSize,
            lineHeight: getComputedStyle(paragraph).lineHeight,
            color: getComputedStyle(paragraph).color,
            background: getComputedStyle(document.body).backgroundColor,
          }
        })
        await page.goto('/README')
        const readme = await measure()
        await page.goto('/quotes')
        expect(await measure()).toEqual(readme)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
        await expect(page.locator('a a')).toHaveCount(0)
        const quoteLink = page.locator('blockquote a[href^="/quote/"]').first()
        await quoteLink.click()
        await expect(page).toHaveURL(/\/quote\//)
        await expect.poll(measure).toEqual(readme)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      })
    }
  }

  test('navigates to a quote detail page', async ({ page }) => {
    await page.goto('/quotes')
    const firstCard = page.locator('a[href^="/quote/"]').first()
    const href = await firstCard.getAttribute('href')
    await firstCard.click()
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + '$'))
    await expect(page.getByRole('link', { name: '← Back to all quotes' })).toBeVisible()
  })

  test('/quote redirects to /quotes', async ({ page }) => {
    await page.goto('/quote')
    await expect(page).toHaveURL(new RegExp('/quotes$'))
  })
})
