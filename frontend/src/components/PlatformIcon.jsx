import React from "react";

const platforms = {
  netflix: {
    name: "Netflix",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    height: "18px",
  },
  prime: {
    name: "Prime Video",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg",
    height: "16px",
  },
  hotstar: {
    name: "Disney+ Hotstar",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Disney%2B_Hotstar_2024.svg",
    height: "26px",
  },
  appletv: {
    name: "Apple TV+",
    url: "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg",
    height: "18px",
    filter: "invert(1)",
  },
  zee5: {
    name: "ZEE5",
    url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/ZEE5_2025.svg",
    height: "18px",
  },
  sonyliv: {
    name: "Sony LIV",
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f7/SonyLIV_2020.png",
    height: "22px",
  },
  jiocinema: {
    name: "JioCinema",
    url: "https://upload.wikimedia.org/wikipedia/en/a/a4/JioCinema_Horizontal_%282024%29.svg",
    height: "22px",
  },
};

export default function PlatformIcon({ platform, style = {}, small = false }) {
  if (!platform) return null;

  const normalizedPlatform = platform.toLowerCase().trim();
  const p = platforms[normalizedPlatform];

  // 10x Graceful Adapter: If we don't have the logo, render a beautiful text badge instead of nothing
  if (!p) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: small ? "2px 6px" : "4px 8px",
          background: "rgba(255,255,255,0.15)",
          borderRadius: "6px",
          fontSize: small ? "0.65rem" : "0.75rem",
          fontWeight: 800,
          color: "#f4f4f5",
          textTransform: "uppercase",
          letterSpacing: "1px",
          ...style,
        }}
      >
        {platform}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <img
        src={p.url}
        alt={p.name}
        title={p.name}
        style={{
          height: small ? `calc(${p.height} * 0.85)` : p.height,
          objectFit: "contain",
          filter: p.filter
            ? `${p.filter} drop-shadow(0 2px 4px rgba(0,0,0,0.5))`
            : "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
        }}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    </div>
  );
}
