import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import slugify from "slugify";

const castContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};
const castItemVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 28 },
  },
};

export default function CastRail({ cast }) {
  const railRef = useRef(null);
  const [showArrows, setShowArrows] = useState(false);
  if (!cast || cast.length === 0) return null;

  const scroll = (dir) => {
    if (railRef.current)
      railRef.current.scrollBy({
        left: dir === "left" ? -400 : 400,
        behavior: "smooth",
      });
  };

  const checkOverflow = () => {
    if (!railRef.current) return;
    const { scrollWidth, clientWidth } = railRef.current;
    setShowArrows(scrollWidth > clientWidth + 10);
  };

  return (
    <section style={{ marginTop: "3rem", position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Cast & Crew</h2>
        {showArrows && (
          <div style={{ display: "flex", gap: "8px" }}>
            {["left", "right"].map((dir) => (
              <button
                key={dir}
                onClick={() => scroll(dir)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                {dir === "left" ? (
                  <ChevronLeft size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <motion.div
        ref={railRef}
        variants={castContainerVariants}
        initial="hidden"
        animate="show"
        style={{
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          scrollbarWidth: "none",
        }}
      >
        {cast.map((member) => {
          const m =
            typeof member === "string"
              ? { id: null, name: member, character: "", profileUrl: null }
              : member;
          return (
            <motion.div
              key={m.id || m.name}
              variants={castItemVariants}
              style={{ flexShrink: 0, width: "110px", textAlign: "center" }}
            >
              {m.id ? (
                <Link
                  to={`/person/${m.id}/${slugify(m.name, { lower: true, strict: true })}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <img
                    src={m.profileUrl || "/placeholder-person.jpg"}
                    alt={m.name}
                    style={{
                      width: "90px",
                      height: "90px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      background: "#27272a",
                      marginBottom: "0.5rem",
                      border: "2px solid rgba(255,255,255,0.1)",
                    }}
                    onError={(e) => {
                      e.currentTarget.src =
                        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2290%22 height=%2290%22 viewBox=%220 0 90 90%22%3E%3Crect width=%2290%22 height=%2290%22 fill=%22%2327272a%22/%3E%3C/svg%3E";
                    }}
                  />
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#e4e4e7",
                      lineHeight: 1.3,
                    }}
                  >
                    {m.name}
                  </div>
                  {m.character && (
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#71717a",
                        marginTop: "2px",
                      }}
                    >
                      {m.character}
                    </div>
                  )}
                </Link>
              ) : (
                <>
                  <div
                    style={{
                      width: "90px",
                      height: "90px",
                      borderRadius: "50%",
                      background: "#27272a",
                      margin: "0 auto 0.5rem",
                      border: "2px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      color: "#52525b",
                    }}
                  >
                    👤
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#e4e4e7",
                    }}
                  >
                    {m.name}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
