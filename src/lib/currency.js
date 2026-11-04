const RUPEE = '\u20B9'

export function formatINR(value) {
  if (value === undefined || value === null || value === '') return 'Price unavailable'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return String(value).replaceAll('$', RUPEE).replace(/\b(?:USD|EUR|GBP|CAD|AUD)\b/gi, 'INR')
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
}

// Salary values shown in the app are monthly INR. Convert legacy strings only
// when they clearly identify another pay period.
export function formatINRRange(value) {
  if (value === undefined || value === null || value === '') return ''
  const source = String(value).trim()
  const values = source.match(/\d[\d,]*(?:\.\d+)?/g)?.map((part) => Number(part.replaceAll(',', ''))).filter(Number.isFinite) || []
  if (!values.length || values.length > 2) return source.replaceAll('$', RUPEE).replace(/\b(?:USD|EUR|GBP|CAD|AUD)\b/gi, 'INR')

  const lakhMultiplier = /\b(?:lakh|lakhs|lac|lacs|lpa)\b/i.test(source) ? 100000 : 1
  const croreMultiplier = /\b(?:crore|crores|cr)\b/i.test(source) ? 10000000 : 1
  const thousandMultiplier = /\b(?:k|thousand)\b/i.test(source) ? 1000 : 1
  const periodMultiplier = /\b(?:per\s*year|yearly|annual|annually|\/\s*year|\/\s*yr|lpa)\b/i.test(source) ? 1 / 12
    : /\b(?:per\s*week|weekly|\/\s*week|\/\s*wk)\b/i.test(source) ? 52 / 12
      : /\b(?:per\s*day|daily|\/\s*day)\b/i.test(source) ? 26
        : /\b(?:per\s*hour|hourly|\/\s*hour|\/\s*hr)\b/i.test(source) ? 208 : 1
  const multiplier = lakhMultiplier * croreMultiplier * thousandMultiplier * periodMultiplier
  const formatAmount = (amount) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount * multiplier))
  return `${values.map((amount) => `${RUPEE}${formatAmount(amount)}`).join(" - ")}/month`
}

export function toMonthlySalaryAmount(value, period = 'MONTHLY') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return value
  const normalized = String(period || 'MONTHLY').toUpperCase().replaceAll('-', '_').replaceAll(' ', '_')
  const multiplier = normalized === 'ANNUAL' || normalized === 'YEARLY' ? 1 / 12
    : normalized === 'WEEKLY' ? 52 / 12
      : normalized === 'DAILY' ? 26
        : normalized === 'HOURLY' ? 208 : 1
  return Math.round(amount * multiplier)
}
