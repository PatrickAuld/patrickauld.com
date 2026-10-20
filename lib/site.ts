export const SITE_URL = 'https://patrickauld.com'
export const SITE_DESCRIPTION = 'Patrick J Auld is a Principal Engineer at Roblox and writes about decision making. Read his personal README and collection of favorite quotes.'

export function siteUrl(path = '/') {
  return new URL(path, SITE_URL).href
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(date))
}
