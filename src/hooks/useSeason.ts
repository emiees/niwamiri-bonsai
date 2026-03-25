import { useAppStore } from '../store/appStore'

type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export function useSeason(): Season {
  const config = useAppStore((s) => s.config)
  const hemisphere = config?.hemisphere ?? 'south'
  return getSeason(new Date(), hemisphere)
}

export function getSeason(date: Date, hemisphere: 'north' | 'south'): Season {
  const month = date.getMonth() + 1 // 1-12

  let northSeason: Season
  if (month >= 3 && month <= 5) northSeason = 'spring'
  else if (month >= 6 && month <= 8) northSeason = 'summer'
  else if (month >= 9 && month <= 11) northSeason = 'autumn'
  else northSeason = 'winter'

  if (hemisphere === 'north') return northSeason

  const opposite: Record<Season, Season> = {
    spring: 'autumn',
    summer: 'winter',
    autumn: 'spring',
    winter: 'summer',
  }
  return opposite[northSeason]
}
