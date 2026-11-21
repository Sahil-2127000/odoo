// Date helpers so mock data always looks "current" relative to today.
const DAY = 24 * 60 * 60 * 1000

export const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString()
export const daysFromNow = (n) => new Date(Date.now() + n * DAY).toISOString()

export const addMonths = (iso, months) => {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}
