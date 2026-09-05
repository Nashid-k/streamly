import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ChevronDown, Play, Clock, AlertTriangle } from "lucide-react";

/**
 * SpoilerEpisodeGuide — Expandable episode guide with spoiler protection
 *
 * Each episode shows:
 *   • Title + duration (always visible)
 *   • Synopsis (hidden behind spoiler toggle)
 *   • Content warnings (collapsed by default)
 *   • Thumbnail with play button
 */
export default function SpoilerEpisodeGuide({ episodes = [], season = 1, onPlayEpisode }) {
  const [expandedEpisodes, setExpandedEpisodes] = useState(new Set());
  const [showAllSpoilers, setShowAllSpoilers] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());

  const toggleEpisode = (epNum) => {
    setExpandedEpisodes(prev => {
      const next = new Set(prev);
      if (next.has(epNum)) next.delete(epNum);
      else next.add(epNum);
      return next;
    });
  };

  const toggleSpoiler = (epNum) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev);
      if (next.has(epNum)) next.delete(epNum);
      else next.add(epNum);
      return next;
    });
  };

  if (episodes.length === 0) return null;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      {/* Header with global spoiler toggle */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1rem",
      }}>
        <h3 style={{ margin: 0, fontSize: "0.8rem", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Episode Guide — Season {season}
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAllSpoilers(!showAllSpoilers)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "5px 12px", borderRadius: "100px",
            background: showAllSpoilers ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${showAllSpoilers ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
            color: showAllSpoilers ? "#ef4444" : "#a1a1aa",
            fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
          }}
        >
          {showAllSpoilers ? <Eye size={12} /> : <EyeOff size={12} />}
          {showAllSpoilers ? "Hide Spoilers" : "Reveal Spoilers"}
        </motion.button>
      </div>

      {/* Episode List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {episodes.map((ep, idx) => {
          const isExpanded = expandedEpisodes.has(ep.episodeNumber);
          const isSpoilerRevealed = showAllSpoilers || revealedSpoilers.has(ep.episodeNumber);
          const hasWarnings = ep.contentWarnings && ep.contentWarnings.length > 0;

          return (
            <motion.div
              key={ep.id || ep.episodeNumber || idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              style={{
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
                background: isExpanded ? "rgba(255,255,255,0.03)" : "transparent",
              }}
            >
              {/* Episode Header (always visible) */}
              <div
                onClick={() => toggleEpisode(ep.episodeNumber)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px", cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                {/* Episode number */}
                <span style={{
                  fontSize: "0.85rem", fontWeight: 800, color: "#3f3f46",
                  fontFamily: "monospace", minWidth: "24px", textAlign: "center",
                }}>
                  {String(ep.episodeNumber).padStart(2, "0")}
                </span>

                {/* Title + Duration */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "0.85rem", fontWeight: 600, color: "#e4e4e7",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {ep.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "1px" }}>
                    {ep.duration && (
                      <span style={{ fontSize: "0.65rem", color: "#71717a", display: "flex", alignItems: "center", gap: "3px" }}>
                        <Clock size={9} /> {ep.duration}
                      </span>
                    )}
                    {hasWarnings && !isSpoilerRevealed && (
                      <span style={{
                        fontSize: "0.6rem", fontWeight: 600, color: "#fbbf24",
                        display: "flex", alignItems: "center", gap: "3px",
                      }}>
                        <AlertTriangle size={9} /> Content warning
                      </span>
                    )}
                  </div>
                </div>

                {/* Expand indicator */}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: "#52525b" }}
                >
                  <ChevronDown size={14} />
                </motion.div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {/* Thumbnail */}
                      {ep.thumbnailUrl && (
                        <div style={{
                          position: "relative", borderRadius: "8px", overflow: "hidden",
                          aspectRatio: "16/9", background: "#18181b",
                        }}>
                          <img
                            src={ep.thumbnailUrl}
                            alt={ep.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            loading="lazy"
                          />
                          <div style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
                          }} />
                          {/* Play button */}
                          {onPlayEpisode && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayEpisode(ep.episodeNumber);
                              }}
                              style={{
                                position: "absolute", bottom: "10px", left: "10px",
                                width: "36px", height: "36px", borderRadius: "50%",
                                background: "linear-gradient(135deg, #f43f5e, #fb923c)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                border: "none", cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(244,63,94,0.4)",
                              }}
                            >
                              <Play size={16} fill="#fff" stroke="none" style={{ marginLeft: "2px" }} />
                            </motion.button>
                          )}
                        </div>
                      )}

                      {/* Synopsis with spoiler protection */}
                      {ep.description && (
                        <div>
                          <div style={{ fontSize: "0.72rem", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                            Synopsis
                          </div>
                          {isSpoilerRevealed ? (
                            <p style={{ margin: 0, fontSize: "0.82rem", color: "#a1a1aa", lineHeight: 1.6 }}>
                              {ep.description}
                            </p>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSpoiler(ep.episodeNumber); }}
                              style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "8px 12px", borderRadius: "8px",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px dashed rgba(255,255,255,0.12)",
                                color: "#71717a", fontSize: "0.78rem", fontWeight: 500,
                                cursor: "pointer", width: "100%", textAlign: "left",
                              }}
                            >
                              <EyeOff size={12} />
                              Spoiler hidden — tap to reveal synopsis
                            </button>
                          )}
                        </div>
                      )}

                      {/* Content Warnings */}
                      {hasWarnings && (
                        <div style={{
                          padding: "8px 10px", borderRadius: "8px",
                          background: "rgba(251,191,36,0.06)",
                          border: "1px solid rgba(251,191,36,0.12)",
                        }}>
                          <div style={{
                            fontSize: "0.65rem", fontWeight: 700, color: "#fbbf24",
                            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px",
                            display: "flex", alignItems: "center", gap: "4px",
                          }}>
                            <AlertTriangle size={10} /> Content Advisory
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {ep.contentWarnings.map((warn, i) => (
                              <span key={i} style={{
                                fontSize: "0.65rem", color: "#a1a1aa",
                                background: "rgba(255,255,255,0.06)", padding: "2px 8px",
                                borderRadius: "100px",
                              }}>
                                {warn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
