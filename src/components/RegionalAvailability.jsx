import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check, X, MapPin } from "lucide-react";
import { PLATFORMS, normalizePlatformKey } from "../api/platformAdapter";
import PlatformIcon from "./PlatformIcon";

// Region data with common streaming regions
const REGIONS = [
  { id: "in", name: "India", flag: "🇮🇳", platforms: ["netflix", "prime", "hotstar", "zee5", "sonyliv", "jio", "mxplayer"] },
  { id: "us", name: "United States", flag: "🇺🇸", platforms: ["netflix", "prime", "hulu", "max", "paramount", "peacock", "appletv", "disney"] },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧", platforms: ["netflix", "prime", "appletv", "disney", "britbox"] },
  { id: "au", name: "Australia", flag: "🇦🇺", platforms: ["netflix", "prime", "disney", "stan"] },
  { id: "ca", name: "Canada", flag: "🇨🇦", platforms: ["netflix", "prime", "disney", "appletv"] },
  { id: "de", name: "Germany", flag: "🇩🇪", platforms: ["netflix", "prime", "appletv", "disney"] },
  { id: "jp", name: "Japan", flag: "🇯🇵", platforms: ["netflix", "prime", "appletv", "disney"] },
  { id: "br", name: "Brazil", flag: "🇧🇷", platforms: ["netflix", "prime", "appletv", "disney"] },
];

/**
 * RegionalAvailability — Shows which platforms carry a title in different regions
 *
 * Displays an expandable map with region × platform availability matrix.
 */
export default function RegionalAvailability({ availablePlatforms = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("in"); // Default to India

  // Normalize available platforms for this movie
  const moviePlatforms = new Set();
  for (const p of availablePlatforms) {
    const key = normalizePlatformKey(p);
    if (key) moviePlatforms.add(key);
  }

  // If no platform data, show a generic message
  if (moviePlatforms.size === 0) {
    return (
      <div style={{
        padding: "12px 14px", borderRadius: "10px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: "8px",
        color: "#71717a", fontSize: "0.8rem",
      }}>
        <Globe size={14} />
        <span>Streaming availability data not available for this title.</span>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        whileHover={{ background: "rgba(255,255,255,0.04)" }}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "10px",
          padding: "12px 14px", background: "rgba(255,255,255,0.02)",
          border: "none", cursor: "pointer", color: "#e4e4e7",
        }}
      >
        <Globe size={16} color="#60a5fa" />
        <span style={{ flex: 1, textAlign: "left", fontSize: "0.85rem", fontWeight: 600 }}>
          Regional Availability
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {Array.from(moviePlatforms).slice(0, 3).map(key => (
            <PlatformIcon key={key} platform={key} xs />
          ))}
          {moviePlatforms.size > 3 && (
            <span style={{ fontSize: "0.6rem", color: "#71717a" }}>+{moviePlatforms.size - 3}</span>
          )}
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} color="#71717a" />
        </motion.div>
      </motion.button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 14px 14px" }}>
              {/* Region Selector */}
              <div style={{
                display: "flex", gap: "4px", overflowX: "auto", scrollbarWidth: "none",
                padding: "4px 0 10px", WebkitOverflowScrolling: "touch",
              }}>
                {REGIONS.map(region => (
                  <motion.button
                    key={region.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedRegion(region.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      padding: "5px 10px", borderRadius: "100px", flexShrink: 0,
                      background: selectedRegion === region.id ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedRegion === region.id ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.06)"}`,
                      color: selectedRegion === region.id ? "#60a5fa" : "#a1a1aa",
                      fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <span>{region.flag}</span>
                    <span>{region.name}</span>
                  </motion.button>
                ))}
              </div>

              {/* Availability Matrix for Selected Region */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {REGIONS.find(r => r.id === selectedRegion)?.platforms.map(platformKey => {
                  const platform = PLATFORMS[platformKey];
                  if (!platform) return null;
                  const isAvailable = moviePlatforms.has(platformKey);

                  return (
                    <div
                      key={platformKey}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 10px", borderRadius: "8px",
                        background: isAvailable ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.02)",
                        opacity: isAvailable ? 1 : 0.5,
                      }}
                    >
                      <PlatformIcon platform={platformKey} small />
                      <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 500, color: "#d4d4d8" }}>
                        {platform.name}
                      </span>
                      {isAvailable ? (
                        <div style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          color: "#4ade80", fontSize: "0.7rem", fontWeight: 600,
                        }}>
                          <Check size={12} /> Available
                        </div>
                      ) : (
                        <div style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          color: "#71717a", fontSize: "0.7rem", fontWeight: 500,
                        }}>
                          <X size={12} /> Not available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Note about data accuracy */}
              <div style={{
                marginTop: "10px", fontSize: "0.65rem", color: "#52525b",
                display: "flex", alignItems: "center", gap: "4px",
              }}>
                <MapPin size={10} />
                Availability may vary by region and change without notice.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
