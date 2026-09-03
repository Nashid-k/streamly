/**
 * platformAdapter.js — Unified streaming platform registry
 *
 * 20+ platforms with logos, brand colors, release-time configs,
 * fuzzy normalization, and category groupings.
 *
 * Normalizes any raw string from TMDB / backend / user input into
 * a canonical platform key, or null when nothing matches.
 */

// ─── Platform Registry ──────────────────────────────────────────────────────

// Generate SVG data URI for platform logos (reliable, no 404s)
function brandSvg(text, color, textColor = '#fff') {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40'><rect width='120' height='40' rx='6' fill='${encodeURIComponent(color)}'/><text x='60' y='26' text-anchor='middle' font-family='Arial,sans-serif' font-size='14' font-weight='bold' fill='${encodeURIComponent(textColor)}'>${encodeURIComponent(text)}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
}

export const PLATFORMS = {
  // ── Global giants ──
  netflix: {
    id: "netflix",
    name: "Netflix",
    shortName: "Netflix",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    iconHeight: "18px",
    color: "#E50914",
    gradient: "linear-gradient(135deg, #E50914, #b20710)",
    rapidApiName: "netflix",
    category: "global",
    tags: ["subscription", "originals"],
  },
  prime: {
    id: "prime",
    name: "Prime Video",
    shortName: "Prime",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg",
    iconHeight: "16px",
    color: "#00A8E1",
    gradient: "linear-gradient(135deg, #00A8E1, #0077B5)",
    rapidApiName: "prime",
    category: "global",
    tags: ["subscription", "rental"],
  },
  disney: {
    id: "disney",
    name: "Disney+",
    shortName: "Disney+",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg",
    iconHeight: "18px",
    color: "#113CCF",
    gradient: "linear-gradient(135deg, #113CCF, #0a2a8a)",
    rapidApiName: "disney",
    category: "global",
    tags: ["subscription", "originals"],
  },
  hotstar: {
    id: "hotstar",
    name: "Disney+ Hotstar",
    shortName: "Hotstar",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Disney%2B_Hotstar_2024.svg",
    iconHeight: "26px",
    color: "#0F0617",
    gradient: "linear-gradient(135deg, #0F0617, #1a0a30)",
    rapidApiName: "hotstar",
    category: "india",
    tags: ["subscription", "sports", "regional"],
  },
  appletv: {
    id: "appletv",
    name: "Apple TV+",
    shortName: "Apple TV+",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg",
    iconHeight: "18px",
    iconFilter: "invert(1)",
    color: "#000000",
    gradient: "linear-gradient(135deg, #333, #000)",
    rapidApiName: "apple",
    category: "global",
    tags: ["subscription", "originals"],
  },
  hulu: {
    id: "hulu",
    name: "Hulu",
    shortName: "Hulu",
    iconUrl: brandSvg('HULU', '#1CE783'),
    iconHeight: "16px",
    color: "#1CE783",
    gradient: "linear-gradient(135deg, #1CE783, #0d9e5a)",
    rapidApiName: "hulu",
    category: "global",
    tags: ["subscription"],
  },
  max: {
    id: "max",
    name: "Max",
    shortName: "Max",
    iconUrl: brandSvg('MAX', '#002BE7'),
    iconHeight: "14px",
    color: "#002BE7",
    gradient: "linear-gradient(135deg, #002BE7, #001a8a)",
    rapidApiName: "max",
    category: "global",
    tags: ["subscription", "originals"],
  },
  paramount: {
    id: "paramount",
    name: "Paramount+",
    shortName: "Paramount+",
    iconUrl: brandSvg('PARAMOUNT+', '#0064FF'),
    iconHeight: "16px",
    color: "#0064FF",
    gradient: "linear-gradient(135deg, #0064FF, #004acc)",
    rapidApiName: "paramount",
    category: "global",
    tags: ["subscription"],
  },
  peacock: {
    id: "peacock",
    name: "Peacock",
    shortName: "Peacock",
    iconUrl: brandSvg('PEACOCK', '#FDB927', '#000'),
    iconHeight: "16px",
    color: "#FDB927",
    gradient: "linear-gradient(135deg, #FDB927, #d4a020)",
    rapidApiName: "peacock",
    category: "global",
    tags: ["subscription", "free-tier"],
  },
  crunchycroll: {
    id: "crunchycroll",
    name: "Crunchyroll",
    shortName: "Crunchyroll",
    iconUrl: brandSvg('CRUNCHYROLL', '#F47521'),
    iconHeight: "14px",
    color: "#F47521",
    gradient: "linear-gradient(135deg, #F47521, #c45d18)",
    rapidApiName: "crunchyroll",
    category: "global",
    tags: ["subscription", "anime"],
  },
  mubi: {
    id: "mubi",
    name: "MUBI",
    shortName: "MUBI",
    iconUrl: brandSvg('MUBI', '#333'),
    iconHeight: "14px",
    color: "#000000",
    gradient: "linear-gradient(135deg, #333, #000)",
    rapidApiName: "mubi",
    category: "global",
    tags: ["subscription", "curated", "arthouse"],
  },

  // ── India-specific ──
  zee5: {
    id: "zee5",
    name: "ZEE5",
    shortName: "ZEE5",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6e/ZEE5_2025.svg",
    iconHeight: "18px",
    color: "#8230C6",
    gradient: "linear-gradient(135deg, #8230C6, #5c1f94)",
    rapidApiName: "zee5",
    category: "india",
    tags: ["subscription", "regional"],
  },
  sonyliv: {
    id: "sonyliv",
    name: "Sony LIV",
    shortName: "Sony LIV",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f7/SonyLIV_2020.png",
    iconHeight: "22px",
    color: "#F48220",
    gradient: "linear-gradient(135deg, #F48220, #c46818)",
    rapidApiName: "sonyliv",
    category: "india",
    tags: ["subscription", "sports"],
  },
  jio: {
    id: "jio",
    name: "JioCinema",
    shortName: "JioCinema",
    iconUrl: "https://upload.wikimedia.org/wikipedia/en/a/a4/JioCinema_Horizontal_%282024%29.svg",
    iconHeight: "22px",
    color: "#E5007D",
    gradient: "linear-gradient(135deg, #E5007D, #b80064)",
    rapidApiName: "jio",
    category: "india",
    tags: ["subscription", "free", "sports"],
  },
  mxplayer: {
    id: "mxplayer",
    name: "MX Player",
    shortName: "MX Player",
    iconUrl: brandSvg('MX', '#FF6B00'),
    iconHeight: "16px",
    color: "#FF6B00",
    gradient: "linear-gradient(135deg, #FF6B00, #cc5500)",
    rapidApiName: "mxplayer",
    category: "india",
    tags: ["free", "ad-supported"],
  },
  voot: {
    id: "voot",
    name: "Voot",
    shortName: "Voot",
    iconUrl: brandSvg('VOOT', '#FF0000'),
    iconHeight: "16px",
    color: "#FF0000",
    gradient: "linear-gradient(135deg, #FF0000, #cc0000)",
    rapidApiName: "voot",
    category: "india",
    tags: ["subscription"],
  },
  erosnow: {
    id: "erosnow",
    name: "Eros Now",
    shortName: "Eros Now",
    iconUrl: brandSvg('EROS NOW', '#FF6B00'),
    iconHeight: "16px",
    color: "#FF6B00",
    gradient: "linear-gradient(135deg, #FF6B00, #cc5500)",
    rapidApiName: "erosnow",
    category: "india",
    tags: ["subscription"],
  },
  aha: {
    id: "aha",
    name: "aha",
    shortName: "aha",
    iconUrl: brandSvg('aha', '#FF3366'),
    iconHeight: "16px",
    color: "#FF3366",
    gradient: "linear-gradient(135deg, #FF3366, #cc2952)",
    rapidApiName: "aha",
    category: "india",
    tags: ["subscription", "regional", "telugu"],
  },
  hoichoi: {
    id: "hoichoi",
    name: "Hoichoi",
    shortName: "Hoichoi",
    iconUrl: brandSvg('HOICHOI', '#E5007D'),
    iconHeight: "16px",
    color: "#E5007D",
    gradient: "linear-gradient(135deg, #E5007D, #b80064)",
    rapidApiName: "hoichoi",
    category: "india",
    tags: ["subscription", "regional", "bengali"],
  },
  shemaroo: {
    id: "shemaroo",
    name: "ShemarooMe",
    shortName: "ShemarooMe",
    iconUrl: brandSvg('SHEMAROO', '#FF0000'),
    iconHeight: "16px",
    color: "#FF0000",
    gradient: "linear-gradient(135deg, #FF0000, #cc0000)",
    rapidApiName: "shemaroo",
    category: "india",
    tags: ["subscription", "regional"],
  },
  sunnxt: {
    id: "sunnxt",
    name: "Sun NXT",
    shortName: "Sun NXT",
    iconUrl: brandSvg('SUN NXT', '#FF6600'),
    iconHeight: "16px",
    color: "#FF6600",
    gradient: "linear-gradient(135deg, #FF6600, #cc5200)",
    rapidApiName: "sunnxt",
    category: "india",
    tags: ["subscription", "regional", "tamil"],
  },
  lionsgate: {
    id: "lionsgate",
    name: "Lionsgate Play",
    shortName: "Lionsgate Play",
    iconUrl: brandSvg('LIONSGATE', '#C8102E'),
    iconHeight: "16px",
    color: "#C8102E",
    gradient: "linear-gradient(135deg, #C8102E, #a00d24)",
    rapidApiName: "lionsgate",
    category: "india",
    tags: ["subscription"],
  },

  // ── International niche ──
  britbox: {
    id: "britbox",
    name: "BritBox",
    shortName: "BritBox",
    iconUrl: brandSvg('BRITBOX', '#00B140'),
    iconHeight: "16px",
    color: "#00B140",
    gradient: "linear-gradient(135deg, #00B140, #008d33)",
    rapidApiName: "britbox",
    category: "global",
    tags: ["subscription", "british"],
  },
  stan: {
    id: "stan",
    name: "Stan",
    shortName: "Stan",
    iconUrl: brandSvg('STAN', '#0D47A1'),
    iconHeight: "16px",
    color: "#0D47A1",
    gradient: "linear-gradient(135deg, #0D47A1, #0a3880)",
    rapidApiName: "stan",
    category: "global",
    tags: ["subscription", "australian"],
  },
  curiositystream: {
    id: "curiositystream",
    name: "Curiosity Stream",
    shortName: "Curiosity",
    iconUrl: brandSvg('CURIOSITY', '#1A1A2E'),
    iconHeight: "16px",
    color: "#1A1A2E",
    gradient: "linear-gradient(135deg, #1A1A2E, #0d0d17)",
    rapidApiName: "curiositystream",
    category: "global",
    tags: ["subscription", "documentary"],
  },
  justwatch: {
    id: "justwatch",
    name: "JustWatch",
    shortName: "JustWatch",
    iconUrl: brandSvg('JUSTWATCH', '#00C3FF'),
    iconHeight: "16px",
    color: "#00C3FF",
    gradient: "linear-gradient(135deg, #00C3FF, #009ccc)",
    rapidApiName: "justwatch",
    category: "aggregator",
    tags: ["aggregator"],
  },
};

// ─── Category Groupings ─────────────────────────────────────────────────────

export const PLATFORM_CATEGORIES = {
  global: {
    name: "Global",
    description: "International streaming platforms",
    ids: ["netflix", "prime", "disney", "appletv", "hulu", "max", "paramount", "peacock", "crunchycroll", "mubi"],
  },
  india: {
    name: "India",
    description: "Indian streaming platforms",
    ids: ["hotstar", "zee5", "sonyliv", "jio", "mxplayer", "voot", "erosnow", "aha", "hoichoi", "shemaroo", "sunnxt", "lionsgate"],
  },
  free: {
    name: "Free",
    description: "Free or ad-supported platforms",
    ids: ["jio", "mxplayer"],
  },
  anime: {
    name: "Anime",
    description: "Anime-focused platforms",
    ids: ["crunchycroll"],
  },
  arthouse: {
    name: "Arthouse & Docs",
    description: "Curated cinema and documentaries",
    ids: ["mubi", "curiositystream"],
  },
};

// ─── Normalization ──────────────────────────────────────────────────────────

// Order matters — more specific matches first
const NORMALIZATION_RULES = [
  // Disney variants (check before generic "hotstar")
  { pattern: /disney\+?\s*hotstar/i, key: "hotstar" },
  { pattern: /disney\+/i, key: "disney" },
  { pattern: /disney/i, key: "disney" },

  // Amazon variants
  { pattern: /prime\s*video/i, key: "prime" },
  { pattern: /amazon\s*prime/i, key: "prime" },
  { pattern: /amazon/i, key: "prime" },
  { pattern: /prime/i, key: "prime" },

  // Netflix
  { pattern: /netflix/i, key: "netflix" },

  // Apple
  { pattern: /apple\s*tv\+?/i, key: "appletv" },
  { pattern: /apple/i, key: "appletv" },

  // Hotstar standalone
  { pattern: /hotstar/i, key: "hotstar" },

  // India-specific
  { pattern: /zee\s*5|zee5/i, key: "zee5" },
  { pattern: /zee\b/i, key: "zee5" },
  { pattern: /sony\s*liv|sonyliv/i, key: "sonyliv" },
  { pattern: /sony/i, key: "sonyliv" },
  { pattern: /jio\s*cinema|jiocinema/i, key: "jio" },
  { pattern: /jio/i, key: "jio" },
  { pattern: /mx\s*player|mxplayer/i, key: "mxplayer" },
  { pattern: /mx\b/i, key: "mxplayer" },
  { pattern: /voot/i, key: "voot" },
  { pattern: /eros\s*now|erosnow/i, key: "erosnow" },
  { pattern: /eros/i, key: "erosnow" },
  { pattern: /\baha\b/i, key: "aha" },
  { pattern: /hoichoi/i, key: "hoichoi" },
  { pattern: /shemaroo/i, key: "shemaroo" },
  { pattern: /sun\s*nxt|sunnxt/i, key: "sunnxt" },
  { pattern: /lionsgate/i, key: "lionsgate" },

  // International
  { pattern: /hulu/i, key: "hulu" },
  { pattern: /max\b|hbo\s*max/i, key: "max" },
  { pattern: /hbo/i, key: "max" },
  { pattern: /paramount/i, key: "paramount" },
  { pattern: /peacock/i, key: "peacock" },
  { pattern: /crunchy\s*roll|crunchycroll/i, key: "crunchycroll" },
  { pattern: /\bmubi\b/i, key: "mubi" },
  { pattern: /brit\s*box|britbox/i, key: "britbox" },
  { pattern: /\bstan\b/i, key: "stan" },
  { pattern: /curiosity/i, key: "curiositystream" },
  { pattern: /just\s*watch|justwatch/i, key: "justwatch" },
];

/**
 * Normalizes an arbitrary platform string into a canonical platform key.
 * @param {string} rawName - Platform name from TMDB, backend, or user input
 * @returns {string|null} Canonical platform key or null if no match
 */
export function normalizePlatformKey(rawName) {
  if (!rawName) return null;
  const trimmed = String(rawName).trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  // Direct key match
  if (PLATFORMS[lower]) return lower;

  // Rule-based fuzzy matching
  for (const rule of NORMALIZATION_RULES) {
    if (rule.pattern.test(trimmed)) return rule.key;
  }

  // Substring scan as last resort
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    if (lower.includes(key) || lower.includes(platform.name.toLowerCase()) || lower.includes(platform.shortName.toLowerCase())) {
      return key;
    }
  }

  return null;
}

// ─── PlatformAdapter Class ──────────────────────────────────────────────────

export class PlatformAdapter {
  static getPlatform(id) {
    return PLATFORMS[id] || null;
  }

  static getAllPlatforms() {
    return Object.values(PLATFORMS);
  }

  static getPlatformsByCategory(category) {
    const cat = PLATFORM_CATEGORIES[category];
    if (!cat) return [];
    return cat.ids.map((id) => PLATFORMS[id]).filter(Boolean);
  }

  static getName(id) {
    return this.getPlatform(id)?.name || id;
  }

  static getShortName(id) {
    return this.getPlatform(id)?.shortName || this.getName(id);
  }

  static getIconUrl(id) {
    return this.getPlatform(id)?.iconUrl || "";
  }

  static getColor(id) {
    return this.getPlatform(id)?.color || "#ffffff";
  }

  static getGradient(id) {
    return this.getPlatform(id)?.gradient || `linear-gradient(135deg, ${this.getColor(id)}, ${this.getColor(id)}88)`;
  }

  static getCategory(id) {
    return this.getPlatform(id)?.category || "global";
  }

  static getTags(id) {
    return this.getPlatform(id)?.tags || [];
  }

  /**
   * Resolves a raw platform name into the full platform object.
   * @param {string} rawName
   * @returns {object|null} Platform object or null
   */
  static resolveFromRawName(rawName) {
    if (!rawName) return null;
    const key = normalizePlatformKey(rawName);
    return key ? PLATFORMS[key] : null;
  }

  /**
   * Find the best platform match from an array of platform strings.
   * @param {string[]} platforms
   * @returns {object|null} First matching platform
   */
  static resolveBestMatch(platforms) {
    if (!platforms || !Array.isArray(platforms)) return null;
    for (const p of platforms) {
      const match = this.resolveFromRawName(p);
      if (match) return match;
    }
    return null;
  }

  /**
   * Returns all platform keys as an array.
   */
  static getAllKeys() {
    return Object.keys(PLATFORMS);
  }

  /**
   * Check if a given platform key is valid.
   */
  static isValid(id) {
    return !!PLATFORMS[id];
  }
}

// ─── mapSource ──────────────────────────────────────────────────────────────

/**
 * Maps a movie's availablePlatforms into a single source/sourceName pair.
 * Returns null source when nothing matches (no more Netflix default).
 */
export function mapSource(movie) {
  if (movie.availablePlatforms && movie.availablePlatforms.length > 0) {
    for (const p of movie.availablePlatforms) {
      const match = PlatformAdapter.resolveFromRawName(p);
      if (match) {
        return { ...movie, source: match.id, sourceName: match.name };
      }
    }
  }
  return { ...movie, source: null, sourceName: null };
}

/**
 * Normalize a movie's source and sourceName from availablePlatforms.
 * This is the single source of truth — call it on ANY movie data from any API.
 * Handles: raw strings, undefined source, missing availablePlatforms, etc.
 *
 * Priority chain:
 * 1. If movie.source is already a canonical key → use it directly
 * 2. If movie.source is a raw string → normalize it
 * 3. Fall back to availablePlatforms[0] and normalize
 * 4. Return null (never default to netflix or any platform)
 */
export function normalizeMovieSource(movie) {
  // Guard: never crash on null/undefined
  if (!movie || typeof movie !== 'object') return { source: null, sourceName: null };

  // 1. If source is already a valid canonical key, use it — but always set sourceName to match
  if (movie.source && PLATFORMS[movie.source]) {
    return { ...movie, source: movie.source, sourceName: PLATFORMS[movie.source].name };
  }

  // 2. If source is a raw string, normalize it
  if (movie.source && typeof movie.source === 'string') {
    const key = normalizePlatformKey(movie.source);
    if (key) {
      return { ...movie, source: key, sourceName: PLATFORMS[key].name };
    }
  }

  // 3. Try availablePlatforms — use the FIRST match (most relevant)
  if (movie.availablePlatforms && Array.isArray(movie.availablePlatforms) && movie.availablePlatforms.length > 0) {
    for (const p of movie.availablePlatforms) {
      const match = PlatformAdapter.resolveFromRawName(p);
      if (match) {
        return { ...movie, source: match.id, sourceName: match.name };
      }
    }
    // No match found — use raw first platform as sourceName for transparency
    const rawFirst = movie.availablePlatforms[0];
    if (rawFirst) {
      const rawKey = normalizePlatformKey(rawFirst);
      if (rawKey) {
        return { ...movie, source: rawKey, sourceName: PLATFORMS[rawKey].name };
      }
      return { ...movie, source: null, sourceName: rawFirst };
    }
  }

  // 4. No platform data — keep all movie properties, set source to null (never Netflix default)
  return { ...movie, source: null, sourceName: null };
}

/**
 * Normalize an array of movies with source/sourceName resolution.
 * Safely handles undefined/null elements in the array.
 */
export function normalizeMoviesSources(movies) {
  if (!Array.isArray(movies)) return [];
  return movies.filter(Boolean).map(normalizeMovieSource);
}

/**
 * Resolve all available platform keys for a movie.
 * Returns an array of unique canonical platform IDs.
 */
export function resolveAllPlatforms(movie) {
  if (!movie?.availablePlatforms?.length) return [];
  const seen = new Set();
  const result = [];
  for (const p of movie.availablePlatforms) {
    const key = normalizePlatformKey(p);
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}
