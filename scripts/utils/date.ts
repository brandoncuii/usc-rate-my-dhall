export function getPacificDateISO(): string {
  const now = new Date()
  const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  return `${pacificDate.getFullYear()}-${String(pacificDate.getMonth() + 1).padStart(2, '0')}-${String(pacificDate.getDate()).padStart(2, '0')}`
}
