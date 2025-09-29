// 競艇場マスタデータ

export interface VenueInfo {
  id: string
  name: string
  display_name: string
  official_code: number
  color_scheme: {
    primary: string
    accent: string
    gradient: string
  }
  location: {
    prefecture: string
    city: string
  }
  characteristics: string[]
  is_available: boolean
}

export const VENUES: Record<string, VenueInfo> = {
  suminoye: {
    id: 'suminoye',
    name: '住之江',
    display_name: '住之江競艇場',
    official_code: 12,
    color_scheme: {
      primary: 'blue',
      accent: 'cyan',
      gradient: 'from-blue-50 to-cyan-100'
    },
    location: {
      prefecture: '大阪府',
      city: '大阪市住之江区'
    },
    characteristics: ['都市型', '淡水', '企業杯多数'],
    is_available: true
  },
  tsu: {
    id: 'tsu',
    name: '津',
    display_name: '津競艇場',
    official_code: 5,
    color_scheme: {
      primary: 'green',
      accent: 'emerald',
      gradient: 'from-green-50 to-emerald-100'
    },
    location: {
      prefecture: '三重県',
      city: '津市'
    },
    characteristics: ['海水', '風の影響', 'G1多数開催'],
    is_available: false // 実装予定
  },
  amagasaki: {
    id: 'amagasaki',
    name: '尼崎',
    display_name: '尼崎競艇場',
    official_code: 6,
    color_scheme: {
      primary: 'purple',
      accent: 'violet',
      gradient: 'from-purple-50 to-violet-100'
    },
    location: {
      prefecture: '兵庫県',
      city: '尼崎市'
    },
    characteristics: ['淡水', 'ナイター', '企業杯'],
    is_available: false // 実装予定
  }
}

export const getVenueInfo = (venueId: string): VenueInfo | null => {
  return VENUES[venueId] || null
}

export const getAvailableVenues = (): VenueInfo[] => {
  return Object.values(VENUES).filter(venue => venue.is_available)
}

export const getAllVenues = (): VenueInfo[] => {
  return Object.values(VENUES)
}