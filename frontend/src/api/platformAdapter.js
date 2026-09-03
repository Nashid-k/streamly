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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Max_%28streaming_service%29_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Paramount%2B_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Peacock_Streaming_Service_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/7/70/Crunchyroll_logo_%282023%29.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3e/MUBI_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a0/MX_Player_logo_2022.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Voot_logo_2023.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Eros_Now_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Aha_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Hoichoi_Logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Shemaroo_Entertainment_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/6/67/Sun_NXT_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/5/52/Lionsgate_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/7/75/BritBox_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Stan_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a4/CuriosityStream_logo.svg",
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
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/4/45/JustWatch_logo.svg",
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
