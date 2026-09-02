import { useCallback, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Check, Star } from "lucide-react";
import slugify from "slugify";
import PlatformIcon from "./PlatformIcon";
import { getTMDBWeekdayShort } from "../utils/timezone";
import { useNavigate } from "react-router-dom";
import { movieService } from "../api/movieService";
import { useAppAuth } from "../context/AuthContext";
import { useToast } from "./Toast";

/* ─────────────────────────────────────────────────────────────
   MovieCard — "Cinematic Curtain" hover design
   
   How it works:
   • Everything lives INSIDE .poster-wrapper (overflow: hidden)
   • Hover state is driven by framer-motion whileHover on the
     single root div — zero JS state, zero timeouts, zero bugs
   • The curtain panel slides up from translateY(100%) → 0
   • The image dims + scales cinematically via CSS
   • Mouse enter/leave is on one element — can never get stuck
   ─────────────────────────────────────────────────────────────*/

// Animation variants — defined outside component so they're stable refs
const cardVariants = {
  rest: { scale: 1, zIndex: 1, transition: { duration: 0.3, ease: "easeOut" } },
  hover: {
    scale: 1.06,
    zIndex: 20,
    transition: { duration: 0.8, ease: "easeInOut" },
  },
};
const curtainVariants = {
  rest: { opacity: 0, transition: { duration: 0.3, ease: "easeOut" } },
  hover: {
    opacity: 1,
    transition: { duration: 0.6, delay: 0.8, ease: "easeOut" },
  },
};

const imageVariants = {
  rest: {
    filter: "brightness(1) saturate(1)",
    transition: { duration: 0.4, ease: "easeOut" },
  },
  hover: {
    filter: "brightness(0.65) saturate(1.2)",
    transition: { duration: 0.8, delay: 0.8, ease: "easeOut" },
  },
};

const titleVariants = {
  rest: { opacity: 0, y: 6, transition: { duration: 0.2, ease: "easeOut" } },
  hover: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

const metaVariants = {
  rest: { opacity: 0, y: 8, transition: { duration: 0.2, ease: "easeOut" } },
  hover: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

const btnVariants = {
  rest: { opacity: 0, y: 10, transition: { duration: 0.2, ease: "easeOut" } },
  hover: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.95, ease: [0.16, 1, 0.3, 1] },
  },
};
import { PrefetchAdapter } from "../api/prefetchAdapter";

import { useVirtualRenderAdapter } from "../api/virtualRenderAdapter";
import { CdnImageAdapter } from "../api/cdnImageAdapter";

export default function MovieCard({
  movie,
  showProgress = false,
  progressValue = 0,
}) {
  const navigate = useNavigate();
  const { isInList, toggleMyList } = useAppAuth();
  const { toast } = useToast();
  const { isVisible, ref: virtualRef } = useVirtualRenderAdapter("400px"); // render 400px before it comes into view
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const [detailedLogo, setDetailedLogo] = useState(null);
  const [logoFetchAttempted, setLogoFetchAttempted] = useState(false);
  const isTvContent = movie?.isSeries || String(movie?.id || '').startsWith('tmdb-tv-');

  const handleMouseEnter = useCallback(() => {
    // 1. Instantly trigger background data prefetch for 0ms load times if clicked
    PrefetchAdapter.prefetchMovieDetails(movie.id, movie.source || "netflix");

    // 2. Debounce the hover animation state to prevent UI thrashing on quick swipes
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 250);
  }, [movie]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  }, []);

  useEffect(() => {
    if (isHovered && !movie.logoUrl && !logoFetchAttempted) {
      const timer = setTimeout(() => {
        setLogoFetchAttempted(true);
        movieService
          .getMovieDetails(movie.id, movie.source || "all")
          .then((data) => {
            if (data.logoUrl) setDetailedLogo(data.logoUrl);
          })
          .catch(() => {});
      }, 50); // Fire fetch almost immediately on hover intent (80ms), so logo is ready before hover animation finishes at 250ms!
      return () => clearTimeout(timer);
    }
  }, [isHovered, movie.id, movie.logoUrl, logoFetchAttempted, movie.source]);

  const navigateToDetails = useCallback(() => {
    const slug = slugify(movie.title, { lower: true, strict: true });
    navigate(`/watch/${movie.id}/${slug}`);
  }, [navigate, movie]);

  const handleToggleMyList = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wasInList = isInList(movie.id);
      toggleMyList(movie);
      toast({
        title: wasInList ? "Removed from List" : "Added to My List",
        message: wasInList
          ? `"${movie.title}" was removed.`
          : `"${movie.title}" saved to your list.`,
        type: wasInList ? "info" : "success",
        duration: 2500,
      });
    },
    [movie, isInList, toggleMyList, toast],
  );

  const inList = isInList(movie.id);
  const rating = movie.imdbRating;
  const ratingColor =
    rating >= 8
      ? "#4ade80"
      : rating >= 6.5
        ? "#fbbf24"
        : rating > 0
          ? "#f87171"
          : null;

  return (
    <div
      ref={virtualRef}
      style={{ width: "100%", height: "100%", minHeight: "200px" }}
    >
      {isVisible ? (
        <motion.div
          className="movie-card"
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          animate="rest"
          onClick={navigateToDetails}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: "pointer",
            position: "relative",
            willChange: "transform, z-index",
          }}
        >
          {/* ── Poster wrapper ───────────────────────────────── */}
          <div
            className="poster-wrapper"
            style={{
              overflow: "hidden",
              background: "#121217",
              position: "relative",
            }}
          >
            {/* Placeholder blur-up / skeleton while loading */}
            {!isLoaded && (
              <div
                className="skeleton"
                style={{ position: "absolute", inset: 0, zIndex: 0 }}
              >
                {CdnImageAdapter.getTinyUrl(
                  movie.posterUrl || movie.backdropUrl,
                ) && (
                  <img
                    src={CdnImageAdapter.getTinyUrl(
                      movie.posterUrl || movie.backdropUrl,
                    )}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "blur(10px) brightness(0.8)",
                      transform: "scale(1.1)",
                    }}
                  />
                )}
              </div>
            )}

            {/* Platform Badge */}
            {(() => {
              const platformKey = movie.source || (movie.availablePlatforms?.[0]?.toLowerCase().includes('hotstar') ? 'hotstar' : movie.availablePlatforms?.[0]?.toLowerCase().includes('prime') ? 'prime' : movie.availablePlatforms?.[0]?.toLowerCase().includes('apple') ? 'appletv' : movie.availablePlatforms?.[0]?.toLowerCase().includes('zee') ? 'zee5' : movie.availablePlatforms?.[0]?.toLowerCase().includes('sony') ? 'sonyliv' : movie.availablePlatforms?.[0]?.toLowerCase().includes('jio') ? 'jio' : 'netflix');
              if (!platformKey) return null;
              return (
                <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                  <PlatformIcon platform={platformKey} small={true} />
                </div>
              );
            })()}

            {/* Bottom-left badges: SERIES + airing day */}
            {isTvContent && !isHovered && (
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "8px",
                  zIndex: 10,
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  SERIES
                </div>
                {movie.nextEpisode?.releaseDate && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(244,63,94,0.9), rgba(239,68,68,0.9))",
                      color: "#fff",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "0.5rem",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      backdropFilter: "blur(6px)",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
                    NEW {getTMDBWeekdayShort(movie.nextEpisode.releaseDate).toUpperCase()}
                  </div>
                )}
              </div>
            )}

            {/* Poster image (Always visible, darkens on hover) */}
            <motion.img
              src={CdnImageAdapter.getUrl(movie.posterUrl || movie.backdropUrl)}
              alt={movie.title}
              className="movie-poster"
              loading="lazy"
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              variants={imageVariants}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 1,
                willChange: "transform, opacity, filter",
                opacity: isLoaded ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
            />

            {/* ── Cinematic curtain ─────────────────────────── */}
            <motion.div
              variants={curtainVariants}
              style={{
                position: "absolute",
                inset: 0,
                willChange: "opacity",
                background:
                  "linear-gradient(to top, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.7) 50%, rgba(9,9,11,0.2) 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
                padding: "1.25rem",
                gap: "12px",
                textAlign: "center",
                zIndex: 5,
              }}
            >
              {/* Authentic Logo or Title */}
              {movie.logoUrl || detailedLogo ? (
                <motion.img
                  variants={titleVariants}
                  src={movie.logoUrl || detailedLogo}
                  alt={movie.title}
                  style={{
                    width: "85%",
                    maxHeight: "65px",
                    objectFit: "contain",
                    marginBottom: "4px",
                    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.9))",
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              ) : (
                <motion.div
                  variants={titleVariants}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "0.92rem",
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.25,
                      letterSpacing: "-0.01em",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                      marginBottom: "4px",
                    }}
                  >
                    {movie.title}
                  </h4>
                </motion.div>
              )}

              {/* Meta row — rating + year + series badge */}
              <motion.div
                variants={metaVariants}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "#a1a1aa",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {ratingColor && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      color: ratingColor,
                    }}
                  >
                    <Star size={10} fill="currentColor" stroke="none" />
                    {rating}
                  </span>
                )}
                {(movie.releaseYear || movie.year) && (
                  <span>
                    {(movie.releaseYear || movie.year)
                      ?.toString()
                      .substring(0, 4)}
                  </span>
                )}
                {isTvContent && (
                  <span
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      color: "#a1a1aa",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                    }}
                  >
                    SERIES
                  </span>
                )}
                {isTvContent && movie.nextEpisode?.releaseDate && (
                  <span
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      color: "#f43f5e",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      fontSize: "0.55rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {getTMDBWeekdayShort(movie.nextEpisode.releaseDate)}s
                  </span>
                )}
                {/* Genre dots */}
                {movie.genres &&
                  movie.genres.slice(0, 2).map((g, i) => (
                    <span
                      key={g}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#71717a",
                      }}
                    >
                      {i === 0 && (
                        <span
                          style={{
                            width: "3px",
                            height: "3px",
                            borderRadius: "50%",
                            background: "#52525b",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {g}
                    </span>
                  ))}
              </motion.div>
              {showProgress && progressValue > 0 && (
                <motion.div
                  variants={metaVariants}
                  style={{
                    fontSize: "0.7rem",
                    color: "#a1a1aa",
                    fontWeight: 600,
                  }}
                >
                  {Math.round(progressValue)}% watched
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                variants={btnVariants}
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                  width: "100%",
                }}
              >
                {/* Play — gradient pill */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToDetails();
                  }}
                  className="curtain-play-btn"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    padding: "7px 0",
                    borderRadius: "100px",
                    background:
                      "linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)",
                    border: "none",
                    color: "#fff",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                    boxShadow: "0 3px 12px rgba(244,63,94,0.4)",
                  }}
                >
                  <Play size={14} fill="currentColor" stroke="none" />
                  <span className="desktop-only">Watch</span>
                </button>

                {/* Watchlist — glass circle */}
                <button
                  onClick={handleToggleMyList}
                  title={inList ? "Remove from list" : "Add to My List"}
                  className="curtain-list-btn"
                  style={{
                    width: "32px",
                    height: "32px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: inList
                      ? "rgba(244,63,94,0.18)"
                      : "rgba(255,255,255,0.1)",
                    border: inList
                      ? "1.5px solid rgba(244,63,94,0.55)"
                      : "1.5px solid rgba(255,255,255,0.2)",
                    color: inList ? "#f43f5e" : "#e4e4e7",
                    cursor: "pointer",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {inList ? <Check size={14} /> : <Plus size={14} />}
                </button>
              </motion.div>
            </motion.div>

            {/* Progress bar — always on top of curtain */}
            {showProgress && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: "rgba(255,255,255,0.15)",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg,#f43f5e,#fb923c)",
                    width: `${progressValue}%`,
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              </div>
            )}
          </div>

          {/* ── Card info below poster ────────────────────────── */}
          <div className="movie-info">
            <h3 className="movie-title">{movie.title}</h3>
            <div className="movie-meta">
              <span>
                {(movie.releaseYear || movie.year)?.toString().substring(0, 4)}
              </span>
              {rating > 0 && (
                <span
                  style={{
                    color: ratingColor || "#fbbf24",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <Star size={11} fill="currentColor" stroke="none" />
                  {rating}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
