import React from "react";
import { PLATFORMS, normalizePlatformKey } from "../api/platformAdapter";

export default function PlatformIcon({ platform, style = {}, small = false, xs = false }) {
  if (!platform) return null;

  const p = PLATFORMS[normalizePlatformKey(platform)];

  // 10x Graceful Adapter: If we don't have the logo, render a beautiful text badge instead of nothing
  if (!p) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: xs ? "1px 5px" : small ? "2px 6px" : "4px 8px",
          background: "rgba(255,255,255,0.15)",
          borderRadius: "6px",
          fontSize: xs ? "0.55rem" : small ? "0.65rem" : "0.75rem",
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
        src={p.iconUrl}
        alt={p.name}
        title={p.name}
        style={{
          height: xs ? `calc(${p.iconHeight} * 0.62)` : small ? `calc(${p.iconHeight} * 0.85)` : p.iconHeight,
          objectFit: "contain",
          filter: p.iconFilter
            ? `${p.iconFilter} drop-shadow(0 2px 4px rgba(0,0,0,0.5))`
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
