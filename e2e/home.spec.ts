import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('has expected title and heading', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Patrick J Auld')
    await expect(page.getByRole('heading', { name: 'Patrick J Auld' })).toBeVisible()
  })

  test('shows profile image', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByAltText('Headshot of Patrick J Auld')).toBeVisible()
  })

  test('links to README, quotes, and social profiles', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Personal README of the site author' })).toHaveAttribute('href', '/README')
    await expect(page.getByRole('link', { name: "Patrick Auld's quotes" })).toHaveAttribute('href', '/quotes')
    await expect(page.getByRole('link', { name: 'email' })).toHaveAttribute('href', 'mailto:patrick+homepage@patrickauld.com')
    await expect(page.getByRole('link', { name: 'Patrick Auld on X/Twitter' })).toHaveAttribute('href', 'https://x.com/patrickauld')
    await expect(page.getByRole('link', { name: 'Patrick Auld on LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/patrickauld')
  })

  test('navigates to the quotes page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: "Patrick Auld's quotes" }).click()
    await expect(page).toHaveURL(/\/quotes$/)
  })
})
