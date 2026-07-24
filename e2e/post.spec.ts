import { test, expect } from '@playwright/test'

test.describe('Blog post page', () => {
  test('renders the README post', async ({ page }) => {
    await page.goto('/README')
    await expect(page).toHaveTitle('README | Patrick Auld')
    await expect(page.getByRole('heading', { name: 'README' })).toBeVisible()
  })

  test('shows a 404 for an unknown post', async ({ page }) => {
    const response = await page.goto('/this-post-does-not-exist')
    expect(response?.status()).toBe(404)
  })
})
