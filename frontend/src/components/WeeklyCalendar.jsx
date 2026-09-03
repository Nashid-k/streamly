import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Tv, Film } from "lucide-react";
import { buildWeeklyCalendar, getWeekDays } from "../utils/releaseCalendar";
import { PLATFORMS, normalizePlatformKey } from "../api/platformAdapter";
import PlatformIcon from "./PlatformIcon";
import { useNavigate } from "react-router-dom";
import slugify from "slugify";

/**
 * WeeklyCalendar — Netflix/Prime-style weekly release calendar
 *
 * Shows content releasing each day of the current week,
 * color-coded by platform with expandable day details.
 */
export default function WeeklyCalendar({ items = [], title = "This Week" }) {
  const navigate = useNavigate();
  const weekDays = useMemo(() => getWeekDays(), []);
  const calendar = useMemo(() => buildWeeklyCalendar(items), [items]);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = weekDays.find(d => d.isToday);
    return today?.fullName || "Monday";
  });

  const selectedItems = calendar[selectedDay] || [];
  const totalThisWeek = Object.values(calendar).reduce((sum, day) => sum + day.length, 0);

  if (totalThisWeek === 0) return null;

  return (
    <div style={{ marginBottom: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
        <Calendar size={20} color="#f43f5e" />
        <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
          {title}
        </h2>
        <span style={{
          fontSize: "0.75rem", fontWeight: 600, color: "#a1a1aa",
          background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: "100px",
        }}>
          {totalThisWeek} releases
        </span>
      </div>

      {/* Day Tabs */}
      <div style={{
        display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none",
        padding: "4px 0 12px", WebkitOverflowScrolling: "touch",
      }}>
        {weekDays.map(day => {
          const count = (calendar[day.fullName] || []).length;
          const isSelected = selectedDay === day.fullName;
          return (
            <motion.button
              key={day.fullName}
              onClick={() => setSelectedDay(day.fullName)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "4px", padding: "10px 16px", borderRadius: "12px",
                background: isSelected
                  ? day.isToday ? "linear-gradient(135deg, #f43f5e, #fb923c)" : "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${isSelected ? "transparent" : day.isToday ? "rgba(244,63,94,0.3)" : "rgba(255,255,255,0.06)"}`,
                cursor: "pointer", flexShrink: 0, minWidth: "64px",
                transition: "all 0.2s",
              }}
            >
              <span style={{
                fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: isSelected ? "#fff" : day.isToday ? "#f43f5e" : "#71717a",
              }}>
                {day.name}
              </span>
              <span style={{
                fontSize: "1.1rem", fontWeight: 800,
                color: isSelected ? "#fff" : day.isToday ? "#f43f5e" : "#a1a1aa",
              }}>
                {day.date}
              </span>
              {count > 0 && (
                <span style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: isSelected ? "rgba(255,255,255,0.3)" : "rgba(244,63,94,0.15)",
                  color: isSelected ? "#fff" : "#f43f5e",
                  fontSize: "0.6rem", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Day Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {selectedItems.length === 0 ? (
            <div style={{
              padding: "2rem", textAlign: "center", color: "#52525b",
              background: "rgba(255,255,255,0.02)", borderRadius: "12px",
              border: "1px dashed rgba(255,255,255,0.08)",
            }}>
              <Calendar size={28} style={{ opacity: 0.3, marginBottom: "8px" }} />
              <p style={{ margin: 0, fontSize: "0.85rem" }}>No releases on {selectedDay}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {selectedItems.map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    const slug = slugify(item.title, { lower: true, strict: true });
                    navigate(`/watch/${item.id}/${slug}`);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 14px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                >
                  {/* Platform color dot */}
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                    background: item.platformColor,
                  }} />
                  {/* Thumbnail */}
                  {(item.backdropUrl || item.posterUrl) && (
                    <div style={{
                      width: "80px", height: "45px", borderRadius: "6px", flexShrink: 0,
                      overflow: "hidden", background: "#18181b",
                    }}>
                      <img
                        src={item.backdropUrl || item.posterUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        loading="lazy"
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    </div>
                  )}
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e4e4e7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      <PlatformIcon platform={item.platformKey} xs />
                      <span style={{ fontSize: "0.7rem", color: "#71717a" }}>
                        {item.platformName}
                      </span>
                      {item.releaseType === "episode" && item.episodeInfo && (
                        <span style={{
                          fontSize: "0.6rem", fontWeight: 700, color: "#60a5fa",
                          background: "rgba(96,165,250,0.1)", padding: "1px 6px", borderRadius: "4px",
                        }}>
                          {item.episodeInfo}
                        </span>
                      )}
                      {item.isSeries && (
                        <Tv size={10} color="#71717a" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
