export const GA_TRACKING_ID = 'G-SJ7CGBNE6Y'

export const analyticsEnabled =
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === '1'

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url) => {
  if (!analyticsEnabled) return
  if (!window.gtag) return

  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  })
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }) => {
  if (!analyticsEnabled) return
  if (!window.gtag) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}