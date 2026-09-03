/**
 * Normalizes an arbitrary platform string ("Amazon Prime Video", "Disney+ Hotstar",
 * "Apple TV+", "ZEE5", "SonyLIV", "JioCinema", "Netflix", ...) into the matching
 * PLATFORMS key, or null when nothing matches. This lets PlatformIcon render the
 * correct logo from raw backend/TMDB names instead of showing a text fallback.
 */
export function normalizePlatformKey(rawName) {
  if (!rawName) return null;
  const lower = String(rawName).toLowerCase().trim();
  if (PLATFORMS[lower]) return lower;
  const match =
    lower.includes("prime") || lower.includes("amazon") ? "prime"
    : lower.includes("netflix") ? "netflix"
    : lower.includes("hotstar") || lower.includes("disney") ? "hotstar"
    : lower.includes("apple") ? "appletv"
    : lower.includes("zee5") || lower.includes("zee") ? "zee5"
    : lower.includes("sony") ? "sonyliv"
    : lower.includes("jio") ? "jio"
    : null;
  return match;
}

export const PLATFORMS = {
  netflix: {
    id: "netflix",
    name: "Netflix",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    iconHeight: "18px",
    color: "#E50914",
    rapidApiName: "netflix",
  },
  prime: {
    id: "prime",
    name: "Prime Video",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg",
    iconHeight: "16px",
    color: "#00A8E1",
    rapidApiName: "prime",
  },
  hotstar: {
    id: "hotstar",
    name: "Disney+ Hotstar",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/b6/Disney%2B_Hotstar_2024.svg",
    iconHeight: "26px",
    color: "#0F0617",
    rapidApiName: "hotstar",
  },
  appletv: {
    id: "appletv",
    name: "Apple TV+",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg",
    iconHeight: "18px",
    iconFilter: "invert(1)",
    color: "#000000",
    rapidApiName: "apple",
  },
  zee5: {
    id: "zee5",
    name: "ZEE5",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/6e/ZEE5_2025.svg",
    iconHeight: "18px",
    color: "#8230C6",
    rapidApiName: "zee5",
  },
  sonyliv: {
    id: "sonyliv",
    name: "Sony LIV",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f7/SonyLIV_2020.png",
    iconHeight: "22px",
    color: "#F48220",
    rapidApiName: "sonyliv",
  },
  jio: {
    id: "jio",
    name: "JioCinema",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/en/a/a4/JioCinema_Horizontal_%282024%29.svg",
    iconHeight: "22px",
    color: "#E5007D",
    rapidApiName: "jio",
  },
};

export class PlatformAdapter {
  static getPlatform(id) {
    return PLATFORMS[id] || null;
  }

  static getAllPlatforms() {
    return Object.values(PLATFORMS);
  }

  static getName(id) {
    return this.getPlatform(id)?.name || id;
  }

  static getIconUrl(id) {
    return this.getPlatform(id)?.iconUrl || "";
  }

  static getColor(id) {
    return this.getPlatform(id)?.color || "#ffffff";
  }

  /**
   * Resolves a TMDB or textual platform name into our internal ID
   * @param {string} rawName
   */
  static resolveFromRawName(rawName) {
    if (!rawName) return { id: "netflix", name: "Netflix" };

    const lower = rawName.toLowerCase();
    if (lower.includes("prime")) return PLATFORMS.prime;
    if (lower.includes("netflix")) return PLATFORMS.netflix;
    if (lower.includes("hotstar")) return PLATFORMS.hotstar;
    if (lower.includes("apple")) return PLATFORMS.appletv;
    if (lower.includes("zee5")) return PLATFORMS.zee5;
    if (lower.includes("sony")) return PLATFORMS.sonyliv;
    if (lower.includes("jio")) return PLATFORMS.jio;

    return { id: "netflix", name: "Netflix" }; // fallback
  }
}

/**
 * Maps a movie's availablePlatforms into a single `source`/`sourceName`
 * pair for display, defaulting to netflix when nothing matches.
 */
export function mapSource(movie) {
  let resolved = { id: "netflix", name: "Netflix" };
  if (movie.availablePlatforms && movie.availablePlatforms.length > 0) {
    for (const p of movie.availablePlatforms) {
      const match = PlatformAdapter.resolveFromRawName(p);
      if (match.id !== "netflix" || p.toLowerCase().includes("netflix")) {
        resolved = match;
        break;
      }
    }
  }
  return { ...movie, source: resolved.id, sourceName: resolved.name };
}
