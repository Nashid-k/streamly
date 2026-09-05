/**
 * notificationEngine.js — Smart notification intelligence
 *
 * Generates rich, context-aware notifications for:
 *   • Episode releases (new episode of Y season released)
 *   • Upcoming episodes (Z will air on K day)
 *   • Movie additions (movie streaming on platform name)
 *   • Platform availability (content now on platform)
 *   • Weekly digest (trending content across platforms)
 *   • Watchlist milestones (binge reminders, completion)
 *   • Recommendations (based on viewing patterns)
 *
 * All notifications include image thumbnails, platform badges,
 * deep-links, and categorized types for smart display.
 */

import { normalizePlatformKey, PlatformAdapter } from "../api/platformAdapter";
import { formatTMDBDate, getTMDBWeekday, getTimeUntil } from "./timezone";

// ─── Notification Types ─────────────────────────────────────────────────────

export const NOTIF_TYPES = {
  EPISODE_RELEASED: "episode_released",
  EPISODE_AIRING: "episode_airing",
  MOVIE_ADDED: "movie_added",
  MOVIE_STREAMING: "movie_streaming",
  SERIES_ADDED: "series_added",
  PLATFORM_AVAILABILITY: "platform_availability",
  WEEKLY_DIGEST: "weekly_digest",
  RECOMMENDATION: "recommendation",
  MILESTONE: "milestone",
  WELCOME: "welcome",
};

// ─── Notification Builders ──────────────────────────────────────────────────

/**
 * Create a notification for a newly released episode.
 * "Season 2 Episode 5 of Stranger Things released on Netflix"
 */
export function buildEpisodeReleasedNotification({ title, season, episode, episodeTitle, platform, releaseDate, imageUrl, movieId }) {
  const platformKey = normalizePlatformKey(platform);
  const platformName = platformKey ? PlatformAdapter.getName(platformKey) : platform || "streaming";
  const formattedDate = releaseDate ? formatTMDBDate(releaseDate, { weekday: 'long', month: 'short', day: 'numeric' }, undefined, platformKey) : "today";

  return {
    id: `ep-released-${movieId}-s${season}e${episode }`,
    type: NOTIF_TYPES.EPISODE_RELEASED,
    title: `📺 New Episode Released`,
    message: `Season ${season}, Episode ${episode}${episodeTitle ? `: "${episodeTitle}"` : ""} of ${title} is now streaming on ${platformName}.`,
    detail: `${season}x${String(episode).padStart(2, "0")} · ${formattedDate}`,
    link: `/watch/${movieId}`,
    platform: platformName,
    platformKey,
    image: imageUrl || null,
    season,
    episode,
    createdAt: Date.now(),
    isRead: false,
    priority: "high",
    actionable: true,
  };
}

/**
 * Create a notification for an upcoming episode.
 * "New episode of The Bear airs on Wednesday, Sep 10"
 */
export function buildEpisodeAiringNotification({ title, season, episode, episodeTitle, platform, releaseDate, imageUrl, movieId }) {
  const platformKey = normalizePlatformKey(platform);
  const platformName = platformKey ? PlatformAdapter.getName(platformKey) : platform || "streaming";
  const weekday = getTMDBWeekday(releaseDate, undefined, platformKey);
  const timeUntil = getTimeUntil(releaseDate, undefined, platformKey);
  const formattedDate = formatTMDBDate(releaseDate, { weekday: 'long', month: 'short', day: 'numeric' }, undefined, platformKey);

  const timeContext = timeUntil === "today" ? "later today"
    : timeUntil === "tomorrow" ? "tomorrow"
    : `in ${timeUntil.replace('in ', '')}`;

  return {
    id: `ep-airing-${movieId}-s${season}e${episode }`,
    type: NOTIF_TYPES.EPISODE_AIRING,
    title: `🔴 Upcoming Episode`,
    message: `Season ${season}, Episode ${episode}${episodeTitle ? `: "${episodeTitle}"` : ""} of ${title} will air ${timeContext} on ${platformName}.`,
    detail: `${weekday} · ${formattedDate} · ${platformName}`,
    link: `/watch/${movieId}`,
    platform: platformName,
    platformKey,
    image: imageUrl || null,
    season,
    episode,
    releaseDate,
    createdAt: Date.now(),
    isRead: false,
    priority: "medium",
    actionable: true,
  };
}

/**
 * Create a notification for a movie added to watchlist.
 * "🎬 Inception added — Now streaming on Netflix"
 */
export function buildMovieAddedNotification({ title, platform, year, duration, imageUrl, movieId, isSeries }) {
  const platformKey = normalizePlatformKey(platform);
  const platformName = platformKey ? PlatformAdapter.getName(platformKey) : null;
  const emoji = isSeries ? "📺" : "🎬";
  const typeLabel = isSeries ? "Series" : "Movie";

  const parts = [];
  if (platformName) parts.push(`Now streaming on ${platformName}`);
  if (year) parts.push(`${year}`);
  if (duration) parts.push(duration);

  return {
    id: `added-${movieId }`,
    type: isSeries ? NOTIF_TYPES.SERIES_ADDED : NOTIF_TYPES.MOVIE_ADDED,
    title: `${emoji} ${typeLabel} Added`,
    message: `${title} added to your list.${parts.length > 0 ? " " + parts.join(" · ") : ""}`,
    detail: parts.join(" · ") || null,
    link: `/watch/${movieId}`,
    platform: platformName,
    platformKey,
    image: imageUrl || null,
    createdAt: Date.now(),
    isRead: false,
    priority: "low",
    actionable: true,
  };
}

/**
 * Create a notification for platform availability change.
 * "🎬 Dune: Part Two now available on Prime Video"
 */
export function buildPlatformAvailabilityNotification({ title, platform, previousPlatform, imageUrl, movieId }) {
  const platformKey = normalizePlatformKey(platform);
  const platformName = platformKey ? PlatformAdapter.getName(platformKey) : platform;
  const prevPlatformKey = previousPlatform ? normalizePlatformKey(previousPlatform) : null;
  const prevPlatformName = prevPlatformKey ? PlatformAdapter.getName(prevPlatformKey) : previousPlatform;

  return {
    id: `avail-${movieId}-${platform }`,
    type: NOTIF_TYPES.PLATFORM_AVAILABILITY,
    title: `🆕 Now Available`,
    message: prevPlatformName
      ? `${title} is now streaming on ${platformName} (was on ${prevPlatformName}).`
      : `${title} is now streaming on ${platformName}.`,
    detail: `Available on ${platformName}`,
    link: `/watch/${movieId}`,
    platform: platformName,
    platformKey,
    image: imageUrl || null,
    createdAt: Date.now(),
    isRead: false,
    priority: "medium",
    actionable: true,
  };
}

/**
 * Create a weekly digest notification.
 * "🔥 12 new episodes this week across Netflix, Prime Video, Hotstar"
 */
export function buildWeeklyDigestNotification({ newEpisodes, newMovies, platforms, trending }) {
  const parts = [];
  if (newEpisodes > 0) parts.push(`${newEpisodes} new episode${newEpisodes > 1 ? "s" : ""}`);
  if (newMovies > 0) parts.push(`${newMovies} new movie${newMovies > 1 ? "s" : ""}`);

  const platformNames = (platforms || [])
    .map((p) => PlatformAdapter.getName(normalizePlatformKey(p)) || p)
    .slice(0, 3);

  const message = parts.length > 0
    ? `This week: ${parts.join(" and ")}${platformNames.length > 0 ? ` across ${platformNames.join(", ")}` : ""}.`
    : `Check out what's new across your favorite platforms this week.`;

  const trendingTitles = (trending || []).slice(0, 3).map((t) => t.title).join(", ");
  const detail = trendingTitles ? `Trending: ${trendingTitles}` : null;

  return {
    id: `digest-weekly-${newEpisodes || 0}-${newMovies || 0}`,
    type: NOTIF_TYPES.WEEKLY_DIGEST,
    title: `🔥 Weekly Digest`,
    message,
    detail,
    link: "/",
    createdAt: Date.now(),
    isRead: false,
    priority: "low",
    actionable: true,
    metadata: { newEpisodes, newMovies, platforms: platformNames },
  };
}

/**
 * Create a recommendation notification.
 * "💡 Because you watched Inception — Interstellar is now streaming"
 */
export function buildRecommendationNotification({ title, reason, platform, imageUrl, movieId }) {
  const platformKey = normalizePlatformKey(platform);
  const platformName = platformKey ? PlatformAdapter.getName(platformKey) : platform || null;

  return {
    id: `rec-${movieId }`,
    type: NOTIF_TYPES.RECOMMENDATION,
    title: `💡 Recommended for You`,
    message: `Because you watched ${reason}${platformName ? `, "${title}" is now streaming on ${platformName}` : `, you might like "${title}"`}.`,
    detail: platformName ? `Streaming on ${platformName}` : null,
    link: `/watch/${movieId}`,
    platform: platformName,
    platformKey,
    image: imageUrl || null,
    createdAt: Date.now(),
    isRead: false,
    priority: "low",
    actionable: true,
  };
}

/**
 * Create a milestone notification.
 * "🎉 You've watched 50 episodes this month!"
 */
export function buildMilestoneNotification({ type, count, title }) {
  const messages = {
    watch_count: `You've watched ${count} titles so far. Keep exploring!`,
    binge_streak: `You're on a ${count}-day watching streak! 🔥`,
    list_milestone: `Your watchlist has grown to ${count} titles. Time to start one!`,
    rating_milestone: `You've rated ${count} titles. Your taste profile is shaping up!`,
  };

  return {
    id: `milestone-${type}-${count }`,
    type: NOTIF_TYPES.MILESTONE,
    title: title || `🎉 Milestone Reached`,
    message: messages[type] || `You've reached a new milestone!`,
    detail: null,
    link: "/mylist",
    createdAt: Date.now(),
    isRead: false,
    priority: "low",
    actionable: false,
  };
}

/**
 * Create a welcome notification (improved).
 */
export function buildWelcomeNotification({ isSignedIn }) {
  return {
    id: `welcome-${isSignedIn ? 'in' : 'out' }`,
    type: NOTIF_TYPES.WELCOME,
    title: `👋 Welcome to Streamly!`,
    message: isSignedIn
      ? "Discover movies and series from 20+ streaming platforms — all curated in one place. Your watchlist syncs across devices."
      : "Sign in to unlock personalized notifications, sync your watchlist, and get smart episode alerts.",
    detail: null,
    link: isSignedIn ? "/" : null,
    createdAt: Date.now(),
    isRead: false,
    priority: "low",
    actionable: false,
  };
}

// ─── Smart Watchlist Intelligence ───────────────────────────────────────────

/**
 * Generate notifications from the user's watchlist state.
 * Checks for upcoming episodes, new releases, and milestones.
 *
 * @param {Object} options
 * @param {Array} options.myList - User's watchlist
 * @param {Array} options.continueWatching - User's continue watching list
 * @param {Array} options.existingNotifications - Current notifications
 * @param {Array} options.airingThisWeek - Currently airing content
 * @param {Array} options.trendingThisWeek - Trending content
 * @returns {Array} New notifications to add
 */
export function generateSmartNotifications({ myList = [], continueWatching = [], existingNotifications = [], airingThisWeek = [], trendingThisWeek = [] }) {
  const newNotifs = [];
  const existingIds = new Set(existingNotifications.map((n) => n.id));

  // 1. Check for upcoming episodes in watchlist
  for (const item of myList) {
    if (!item.isSeries && !String(item.id).startsWith("tmdb-tv-")) continue;

    // Upcoming episode alert
    if (item.nextEpisode?.releaseDate) {
      const timeUntil = getTimeUntil(item.nextEpisode.releaseDate, undefined, item.source);
      if (timeUntil === "today" || timeUntil === "tomorrow" || timeUntil.startsWith("in ")) {          const contentId = `ep-airing-${item.id}-s${item.nextEpisode.season || 1}e${item.nextEpisode.episode || 1}`;
        if (existingIds.has(contentId)) continue;
        const notif = buildEpisodeAiringNotification({
          title: item.title,
          season: item.nextEpisode.season || 1,
          episode: item.nextEpisode.episode || 1,
          episodeTitle: item.nextEpisode.title,
          platform: item.source || item.sourceName,
          releaseDate: item.nextEpisode.releaseDate,
          imageUrl: item.backdropUrl || item.posterUrl,
          movieId: item.id,
        });
        notif.id = contentId; // Override timestamp-based ID with content-based ID
        newNotifs.push(notif);
      }
    }
  }

  // 2. Check airing this week for watchlist matches
  if (airingThisWeek.length > 0) {
    for (const airing of airingThisWeek) {
      const inList = myList.some((m) => String(m.id) === String(airing.id));        if (inList && airing.nextEpisode?.releaseDate) {
        const contentId = `ep-airing-${airing.id}-s${airing.nextEpisode.season || 1}e${airing.nextEpisode.episode || 1}`;
        if (existingIds.has(contentId)) continue;
        const notif = buildEpisodeAiringNotification({
          title: airing.title,
          season: airing.nextEpisode.season || 1,
          episode: airing.nextEpisode.episode || 1,
          episodeTitle: airing.nextEpisode.title,
          platform: airing.source || airing.sourceName,
          releaseDate: airing.nextEpisode.releaseDate,
          imageUrl: airing.backdropUrl || airing.posterUrl,
          movieId: airing.id,
        });
        notif.id = contentId;
        newNotifs.push(notif);
      }
    }
  }

  // 3. Continue watching reminders (if haven't watched in 3+ days)
  if (continueWatching.length > 0) {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    for (const item of continueWatching) {
      if (item.lastWatched && item.lastWatched < threeDaysAgo && item.timestamp > 0) {
        const contentId = `cw-reminder-${item.id}`;
        if (existingIds.has(contentId)) continue;
        const notif = {
          id: contentId,
          type: NOTIF_TYPES.MILESTONE,
          title: `⏸️ Pick Up Where You Left Off`,
          message: `You started "${item.title}" ${Math.floor((Date.now() - item.lastWatched) / (1000 * 60 * 60 * 24))} days ago. Continue watching?`,
          detail: item.timestamp > 0 ? `Paused at ${Math.floor(item.timestamp / 60)}:${String(item.timestamp % 60).padStart(2, "0")}` : null,
          link: `/watch/${item.id}`,
          image: item.backdropUrl || item.posterUrl || null,
          createdAt: Date.now(),
          isRead: false,
          priority: "low",
          actionable: true,
        };
        if (!existingIds.has(`cw-reminder-${item.id}`)) {
          newNotifs.push(notif);
        }
      }
    }
  }

  // 4. Watchlist milestone
  if (myList.length === 10 || myList.length === 25 || myList.length === 50 || myList.length === 100) {
    const notif = buildMilestoneNotification({
      type: "list_milestone",
      count: myList.length,
      title: `📚 Watchlist Milestone`,
    });
    if (!existingIds.has(`milestone-list-${myList.length}`)) {
      newNotifs.push(notif);
    }
  }

  // 5. Recommendations based on trending + watchlist genres
  if (trendingThisWeek.length > 0 && myList.length > 0) {
    const watchlistGenres = new Set();
    for (const item of myList) {
      (item.genres || []).forEach((g) => watchlistGenres.add(g.toLowerCase()));
    }

    const recommendations = trendingThisWeek.filter((m) => {
      if (myList.some((w) => String(w.id) === String(m.id))) return false;
      return (m.genres || []).some((g) => watchlistGenres.has(g.toLowerCase()));
    }).slice(0, 2);

    for (const rec of recommendations) {
      const inList = myList.some((m) => String(m.id) === String(rec.id));
      if (!inList) {
        const notif = buildRecommendationNotification({
          title: rec.title,
          reason: myList[0]?.title || "your watchlist",
          platform: rec.source || rec.sourceName,
          imageUrl: rec.backdropUrl || rec.posterUrl,
          movieId: rec.id,
        });
        if (!existingIds.has(`rec-${rec.id}`)) {
          newNotifs.push(notif);
        }
      }
    }
  }

  return newNotifs;
}

// ─── Notification Preferences ───────────────────────────────────────────────

export const DEFAULT_NOTIF_PREFS = {
  episodeReleased: true,
  episodeAiring: true,
  movieAdded: false, // Don't notify for own actions
  platformAvailability: true,
  weeklyDigest: true,
  recommendations: true,
  milestones: true,
  continueWatching: true,
};

export function getNotificationPrefs() {
  try {
    const stored = localStorage.getItem("streamly_notif_prefs");
    return stored ? { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(stored) } : DEFAULT_NOTIF_PREFS;
  } catch {
    return DEFAULT_NOTIF_PREFS;
  }
}

export function setNotificationPrefs(prefs) {
  try {
    localStorage.setItem("streamly_notif_prefs", JSON.stringify(prefs));
  } catch {}
}

export function isNotificationTypeEnabled(type) {
  const prefs = getNotificationPrefs();
  const mapping = {
    [NOTIF_TYPES.EPISODE_RELEASED]: "episodeReleased",
    [NOTIF_TYPES.EPISODE_AIRING]: "episodeAiring",
    [NOTIF_TYPES.MOVIE_ADDED]: "movieAdded",
    [NOTIF_TYPES.SERIES_ADDED]: "movieAdded",
    [NOTIF_TYPES.PLATFORM_AVAILABILITY]: "platformAvailability",
    [NOTIF_TYPES.WEEKLY_DIGEST]: "weeklyDigest",
    [NOTIF_TYPES.RECOMMENDATION]: "recommendations",
    [NOTIF_TYPES.MILESTONE]: "milestones",
    [NOTIF_TYPES.WELCOME]: "milestones",
  };
  const key = mapping[type];
  return key ? prefs[key] !== false : true;
}
