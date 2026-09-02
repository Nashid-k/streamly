/**
 * Timezone-aware date utilities.
 *
 * TMDB broadcasts are in US Eastern Time. These helpers convert raw
 * TMDB dates into the viewer's local date so an Indian user sees
 * "Monday" when a show airs Sunday night in the US, etc.
 */

// Get the user's IANA timezone (e.g. "Asia/Kolkata", "America/New_York")
export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// Get the UTC offset in hours for a given IANA timezone at a given date
function getUTCOffsetHours(timezone, date) {
  try {
    const str = date.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' });
    const match = str.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
    if (match) {
      const parts = match[1].split(':');
      return parseInt(parts[0], 10) + (parts[1] ? parseInt(parts[1], 10) / 60 : 0);
    }
  } catch {}
  // Fallback: compute from difference
  try {
    const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
    const localStr = date.toLocaleString('en-US', { timeZone: timezone });
    const utcDate = new Date(utcStr);
    const localDate = new Date(localStr);
    return (localDate - utcDate) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}

/**
 * Convert a raw TMDB date string (YYYY-MM-DD, US broadcast date) to
 * the user's local date. TMDB dates represent the US Eastern broadcast
 * date, which is approximately UTC-5 (EST) or UTC-4 (EDT).
 *
 * For a user in IST (UTC+5:30), a US Sunday broadcast (Sep 6) arrives
 * Monday morning (Sep 7) — so this returns "2026-09-07".
 */
export function tmdbDateToLocalDate(tmdbDateString, userTimezone) {
  if (!tmdbDateString) return null;
  const tz = userTimezone || getUserTimezone();
  try {
    // Parse as US Eastern broadcast date (approximate: use noon UTC to avoid day boundary issues)
    const usDate = new Date(tmdbDateString + 'T12:00:00-04:00'); // EDT approx
    // Get the user's local date components
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(usDate);
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {}
  return tmdbDateString;
}

/**
 * Format a TMDB date for the user's locale and timezone.
 * Returns e.g. "Monday, Sep 7" or "Sep 7, 2026" depending on options.
 */
export function formatTMDBDate(tmdbDateString, options = {}, userTimezone) {
  if (!tmdbDateString) return '';
  const localDateStr = tmdbDateToLocalDate(tmdbDateString, userTimezone);
  if (!localDateStr) return tmdbDateString;
  const tz = userTimezone || getUserTimezone();
  try {
    const date = new Date(localDateStr + 'T12:00:00Z');
    return date.toLocaleDateString(undefined, { timeZone: tz, ...options });
  } catch {
    return localDateStr;
  }
}

/**
 * Get the weekday name in the user's locale for a TMDB date.
 * e.g. "Monday" for a US Sunday broadcast viewed from India.
 */
export function getTMDBWeekday(tmdbDateString, userTimezone) {
  return formatTMDBDate(tmdbDateString, { weekday: 'long' }, userTimezone);
}

/**
 * Get short weekday (e.g. "Mon") for a TMDB date.
 */
export function getTMDBWeekdayShort(tmdbDateString, userTimezone) {
  return formatTMDBDate(tmdbDateString, { weekday: 'short' }, userTimezone);
}

/**
 * Format a TMDB date as "Mon DD, YYYY" in user's locale.
 */
export function formatTMDBDateFull(tmdbDateString, userTimezone) {
  return formatTMDBDate(tmdbDateString, { month: 'short', day: 'numeric', year: 'numeric' }, userTimezone);
}
