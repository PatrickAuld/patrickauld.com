import { test, expect } from '@playwright/test'

test('core content and navigation work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText('Who is Patrick Auld?')
  await expect(page.getByText("I'm a Principal Engineer")).toBeVisible()
  await expect(page.getByRole('main')).toHaveCount(1)
  await page.getByRole('link', { name: 'Personal README of the site author' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText('How does Patrick Auld work?')
  await expect(page.locator('time').first()).toHaveAttribute('datetime', '2021-07-23T00:00:00.000Z')
  await expect(page.getByText('Updated October 20, 2026')).toBeVisible()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Quotes', exact: true }).click()
  await expect(page.getByText('Done is better than perfect.')).toBeVisible()
  await page.locator('blockquote a[href^="/quote/"]').first().click()
  await expect(page.locator('blockquote')).toBeVisible()
  await expect(page.getByRole('main')).toHaveCount(1)
  await context.close()
})

test('sitemap pages have distinct metadata and working internal links', async ({ page, request }) => {
  test.setTimeout(120_000)
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/xml')
  const xml = await response.text()
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
  expect(urls.length).toBeGreaterThan(3)
  expect(new Set(urls).size).toBe(urls.length)
  const checked = new Set<string>()
  const titles = new Set<string>()

  for (const url of urls) {
    expect(url).toMatch(/^https:\/\/patrickauld\.com\//)
    const path = new URL(url).pathname
    const result = await page.goto(path)
    expect(result?.status(), path).toBe(200)
    await expect(page.locator('link[rel="canonical"]'), path).toHaveAttribute('href', url)
    await expect(page.locator('meta[name="description"]'), path).toHaveAttribute('content', /\S+/)
    await expect(page.locator('meta[property="og:url"]'), path).toHaveAttribute('content', url)
    await expect(page.getByRole('main'), path).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 }), path).toHaveCount(1)
    const title = await page.title()
    expect(titles.has(title), `Duplicate title: ${title}`).toBe(false)
    titles.add(title)

    const links = await page.locator('a[href], img[src]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute(element.tagName === 'IMG' ? 'src' : 'href')!)
    )
    for (const link of links) {
      const destination = new URL(link, url)
      if (destination.origin !== 'https://patrickauld.com' || checked.has(destination.pathname + destination.search)) continue
      const target = destination.pathname + destination.search
      const result = await request.get(target)
      expect(result.ok(), `Broken internal link ${link} on ${path}`).toBe(true)
      checked.add(target)
    }
  }
  expect(urls).toContain('https://patrickauld.com/README')
  expect(urls).toContain('https://patrickauld.com/quotes')
  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  expect(await robots.text()).toContain('User-agent: meta-webindexer\nAllow: /')
  expect(await robots.text()).toContain('Sitemap: https://patrickauld.com/sitemap.xml')
})

test('corrected quote attribution preserves its previous URL', async ({ page }) => {
  await page.goto('/quote/the-needs-of-the-now-strangling-the-wants-of-the-past-f7111ef805e8')
  await expect(page).toHaveURL(/\/quote\/the-needs-of-the-now-strangling-the-wants-of-the-past-831e802412b4$/)
  await expect(page.locator('cite')).toHaveText('— Lift (Edgedancer, Brandon Sanderson)')
  await expect(page.locator('cite a')).toHaveCount(0)
})
