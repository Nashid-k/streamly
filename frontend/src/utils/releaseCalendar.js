/**
 * releaseCalendar.js — Release intelligence system
 *
 * Provides:
 *   • Weekly calendar view with platform color coding
 *   • Countdown timers for upcoming content
 *   • "New This Week" detection for auto-notifications
 *   • "Leaving Soon" alerts for content about to leave platforms
 */

import { normalizePlatformKey, PlatformAdapter, PLATFORMS } from "../api/platformAdapter";
import { formatTMDBDate, getTMDBWeekday, getTimeUntil } from "./timezone";

// ─── Weekly Calendar ────────────────────────────────────────────────────────

/**
 * Group content by release day for the weekly calendar view.
 * Returns an object keyed by day name with platform-tagged items.
 *
 * @param {Array} items - Movies/shows with releaseDate and availablePlatforms
 * @returns {Object} { "Monday": [...], "Tuesday": [...], ... }
 */
export function buildWeeklyCalendar(items = []) {
  const calendar = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [],
    Friday: [], Saturday: [], Sunday: [],
  };

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

  for (const item of items) {
    const releaseDate = item.releaseDate || item.nextEpisode?.releaseDate;
    if (!releaseDate) continue;

    const date = new Date(releaseDate + "T12:00:00Z");
    if (date < startOfWeek || date > endOfWeek) continue;

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    if (!calendar[dayName]) continue;

    const platformKey = normalizePlatformKey(item.source || item.availablePlatforms?.[0]);
    const platformObj = platformKey ? PLATFORMS[platformKey] : null;

    calendar[dayName].push({
      ...item,
      platformKey,
      platformName: platformObj?.name || item.sourceName || "TBA",
      platformColor: platformObj?.color || "#71717a",
      platformGradient: platformObj?.gradient || null,
      formattedDate: formatTMDBDate(releaseDate, { weekday: "short", month: "short", day: "numeric" }, undefined, platformKey),
      weekday: getTMDBWeekday(releaseDate, undefined, platformKey),
      isToday: date.toDateString() === today.toDateString(),
      isPast: date < today,
    });
  }

  // Sort each day by platform name
  for (const day of Object.keys(calendar)) {
    calendar[day].sort((a, b) => a.platformName.localeCompare(b.platformName));
  }

  return calendar;
}

/**
 * Get the days of the current week with dates.
 */
export function getWeekDays() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return {
      name: date.toLocaleDateString("en-US", { weekday: "short" }),
      fullName: date.toLocaleDateString("en-US", { weekday: "long" }),
      date: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      isToday: date.toDateString() === today.toDateString(),
      isPast: date < today && date.toDateString() !== today.toDateString(),
      fullDate: date.toISOString().split("T")[0],
    };
  });
}

// ─── Countdown Timer ────────────────────────────────────────────────────────

/**
 * Calculate countdown to a release date.
 * Returns a human-readable countdown string and numeric values.
 *
 * @param {string} releaseDate - YYYY-MM-DD
 * @param {string} platform - Platform key for timezone handling
 * @returns {Object} { text, days, hours, minutes, isReleased, isToday }
 */
export function getCountdown(releaseDate, platform) {
  if (!releaseDate) return { text: "", days: 0, hours: 0, minutes: 0, isReleased: true, isToday: false };

  const now = new Date();
  const release = new Date(releaseDate + "T00:00:00Z");
  const diff = release.getTime() - now.getTime();

  if (diff <= 0) {
    return { text: "Available Now", days: 0, hours: 0, minutes: 0, isReleased: true, isToday: false };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const timeUntil = getTimeUntil(releaseDate, undefined, platform);
  const isToday = timeUntil === "today";

  let text;
  if (isToday) {
    text = hours > 0 ? `In ${hours}h ${minutes}m` : `In ${minutes}m`;
  } else if (days === 1) {
    text = "Tomorrow";
  } else if (days <= 7) {
    text = `In ${days} days`;
  } else if (days <= 30) {
    text = `In ${Math.ceil(days / 7)} weeks`;
  } else {
    text = formatTMDBDate(releaseDate, { month: "short", day: "numeric" }, undefined, platform);
  }

  return { text, days, hours, minutes, isReleased: false, isToday };
}

/**
 * Get countdown urgency level for badge styling.
 */
export function getCountdownUrgency(days) {
  if (days <= 0) return "released";
  if (days <= 1) return "imminent";  // red pulse
  if (days <= 3) return "soon";      // orange
  if (days <= 7) return "upcoming";  // blue
  return "future";                    // gray
}

// ─── New This Week Detection ────────────────────────────────────────────────

/**
 * Detect content that was released this week (for auto-notifications).
 * Checks both movie releases and new episodes.
 *
 * @param {Array} items - All content items
 * @param {Array} existingNotifs - Current notifications to avoid duplicates
 * @returns {Array} New releases this week
 */
export function detectNewReleasesThisWeek(items = []) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const newReleases = [];

  for (const item of items) {
    // Check movie release date
    if (item.releaseDate) {
      const date = new Date(item.releaseDate + "T12:00:00Z");
      if (date >= startOfWeek && date <= endOfWeek) {
        newReleases.push({
          ...item,
          releaseType: "movie",
          releaseDay: date.toLocaleDateString("en-US", { weekday: "long" }),
        });
      }
    }

    // Check new episode releases
    if (item.nextEpisode?.releaseDate) {
      const date = new Date(item.nextEpisode.releaseDate + "T12:00:00Z");
      if (date >= startOfWeek && date <= endOfWeek) {
        newReleases.push({
          ...item,
          releaseType: "episode",
          episodeInfo: `S${item.nextEpisode.season || 1}E${item.nextEpisode.episode || 1}`,
          releaseDay: date.toLocaleDateString("en-US", { weekday: "long" }),
        });
      }
    }
  }

  return newReleases;
}

// ─── Leaving Soon Detection ─────────────────────────────────────────────────

/**
 * Detect content that's leaving a platform soon.
 * Uses license expiry data from the backend/API.
 *
 * @param {Array} items - Content items with leavingDate field
 * @param {number} thresholdDays - Alert threshold (default 14 days)
 * @returns {Array} Content leaving soon, sorted by urgency
 */
export function detectLeavingSoon(items = [], thresholdDays = 14) {
  const now = new Date();
  const threshold = new Date(now);
  threshold.setDate(now.getDate() + thresholdDays);

  return items
    .filter(item => {
      if (!item.leavingDate) return false;
      const leaveDate = new Date(item.leavingDate + "T00:00:00Z");
      return leaveDate > now && leaveDate <= threshold;
    })
    .map(item => {
      const leaveDate = new Date(item.leavingDate + "T00:00:00Z");
      const daysLeft = Math.ceil((leaveDate - now) / (1000 * 60 * 60 * 24));
      const platformKey = normalizePlatformKey(item.source || item.availablePlatforms?.[0]);
      const platformName = platformKey ? PlatformAdapter.getName(platformKey) : "streaming";

      return {
        ...item,
        daysLeft,
        platformKey,
        platformName,
        urgency: daysLeft <= 3 ? "critical" : daysLeft <= 7 ? "warning" : "info",
        formattedLeaveDate: formatTMDBDate(item.leavingDate, { month: "short", day: "numeric", year: "numeric" }),
        timeUntilLeave: getTimeUntil(item.leavingDate),
        message: daysLeft <= 1
          ? `Leaving ${platformName} tomorrow!`
          : `Leaving ${platformName} in ${daysLeft} days`,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * Build leaving soon notification for a single item.
 */
export function buildLeavingSoonNotification(item) {
  const platformKey = normalizePlatformKey(item.source || item.availablePlatforms?.[0]);
  const platformName = platformKey ? PlatformAdapter.getName(platformKey) : "streaming";
  const daysLeft = item.daysLeft || 0;

  return {
    id: `leaving-${item.id}-${Date.now()}`,
    type: "leaving_soon",
    title: `⏰ Leaving Soon`,
    message: daysLeft <= 1
      ? `"${item.title}" is leaving ${platformName} tomorrow! Watch it before it's gone.`
      : `"${item.title}" will leave ${platformName} in ${daysLeft} days (${item.formattedLeaveDate}).`,
    detail: `Leaveing ${item.formattedLeaveDate} · ${platformName}`,
    link: `/watch/${item.id}`,
    platform: platformName,
    platformKey,
    image: item.backdropUrl || item.posterUrl || null,
    priority: daysLeft <= 3 ? "high" : "medium",
    actionable: true,
    createdAt: Date.now(),
    isRead: false,
  };
}
