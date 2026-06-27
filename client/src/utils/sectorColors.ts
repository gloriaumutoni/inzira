interface SectorStyle {
  bg: string
  badge: string
}

export const SECTOR_COLORS: Record<string, SectorStyle> = {
  Healthcare:     { bg: '#0E7490', badge: '#164E63' },
  Technology:     { bg: '#6D28D9', badge: '#4C1D95' },
  Finance:        { bg: '#0F766E', badge: '#134E4A' },
  Education:      { bg: '#B45309', badge: '#78350F' },
  Engineering:    { bg: '#1D4ED8', badge: '#1E3A8A' },
  Agriculture:    { bg: '#15803D', badge: '#14532D' },
  Law:            { bg: '#B91C1C', badge: '#7F1D1D' },
  Architecture:   { bg: '#0369A1', badge: '#0C4A6E' },
  'Arts & Media': { bg: '#BE185D', badge: '#831843' },
  Business:       { bg: '#4338CA', badge: '#312E81' },
  Other:          { bg: '#475569', badge: '#1E293B' },
}

export const getSectorStyle = (sector: string): SectorStyle =>
  SECTOR_COLORS[sector] ?? SECTOR_COLORS['Other']
