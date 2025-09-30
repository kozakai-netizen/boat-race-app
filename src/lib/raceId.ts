/**
 * Race ID utilities for parsing and formatting
 * Supports formats: "suminoye-20250924-1R", "suminoye-TEST-1R"
 */

export interface RaceIdInfo {
  venue: string
  date: string
  raceNo: string
}

/**
 * Parse race ID string into components
 * @param raceId - Race ID in format "venue-date-raceNo"
 * @returns Parsed race information
 */
export function parseRaceId(raceId: string): RaceIdInfo {
  const parts = raceId.split('-')

  if (parts.length >= 3) {
    const venue = parts[0]
    const dateStr = parts[1]
    const raceNo = parts[2]

    let formattedDate: string
    if (dateStr === 'TEST') {
      formattedDate = '2025-09-24'
    } else if (dateStr.length === 8) {
      // Format yyyymmdd to yyyy-mm-dd
      formattedDate = `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`
    } else {
      formattedDate = dateStr // Assume it's already formatted
    }

    return {
      venue,
      date: formattedDate,
      raceNo
    }
  }

  // Fallback for invalid format
  return {
    venue: 'suminoe',
    date: '2025-09-24',
    raceNo: raceId
  }
}

/**
 * Format race information into race ID string
 * @param info - Race information
 * @returns Race ID in format "venue-yyyymmdd-raceNo"
 */
export function formatRaceId(info: RaceIdInfo): string {
  const dateStr = info.date.replace(/-/g, '')
  return `${info.venue}-${dateStr}-${info.raceNo}`
}

/**
 * Get display name for venue
 * @param venue - Venue code
 * @returns Display name in Japanese
 */
export function getVenueDisplayName(venue: string): string {
  switch (venue) {
    case 'suminoye':
    case 'sumimoye':
    case 'suminoe':
      return '住之江'
    default:
      return venue
  }
}

/**
 * Validate race ID format
 * @param raceId - Race ID to validate
 * @returns true if format is valid
 */
export function isValidRaceId(raceId: string): boolean {
  const parts = raceId.split('-')

  if (parts.length !== 3) return false

  const [venue, dateStr, raceNo] = parts

  // Basic validation
  if (!venue || !dateStr || !raceNo) return false
  if (!raceNo.endsWith('R')) return false

  // Date validation (TEST or yyyymmdd format)
  if (dateStr !== 'TEST' && !/^\d{8}$/.test(dateStr)) return false

  return true
}