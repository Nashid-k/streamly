export const PLATFORMS = {
  netflix: {
    id: "netflix",
    name: "Netflix",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    color: "#E50914",
    rapidApiName: "netflix",
  },
  prime: {
    id: "prime",
    name: "Prime Video",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg",
    color: "#00A8E1",
    rapidApiName: "prime",
  },
  hotstar: {
    id: "hotstar",
    name: "Hotstar",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/1e/Disney%2B_Hotstar_logo.svg",
    color: "#0F0617",
    rapidApiName: "hotstar",
  },
  appletv: {
    id: "appletv",
    name: "Apple TV+",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg",
    color: "#000000",
    rapidApiName: "apple",
  },
  zee5: {
    id: "zee5",
    name: "Zee5",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5a/Zee5-official-logo.jpeg",
    color: "#8230C6",
    rapidApiName: "zee5",
  },
  sonyliv: {
    id: "sonyliv",
    name: "Sony LIV",
    iconUrl: "https://upload.wikimedia.org/wikipedia/en/2/29/Sony_LIV_logo.png",
    color: "#F48220",
    rapidApiName: "sonyliv",
  },
  jio: {
    id: "jio",
    name: "JioCinema",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/52/JioCinema_logo.svg",
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
