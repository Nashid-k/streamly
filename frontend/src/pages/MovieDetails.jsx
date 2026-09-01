import SEO from "../components/SEO";
import MovieDetailsSkeleton from "../components/MovieDetailsSkeleton";
import CastRail from "../components/CastRail";
import { useQuery } from "@tanstack/react-query";
import { movieService } from "../api/movieService";
import Loader from "../components/Loader";
import { TelemetryAdapter } from "../api/telemetryAdapter";
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Play,
  ArrowLeft,
  Star,
  Clock,
  Calendar,
  Plus,
  Check,
  X,
  MonitorPlay,
  Volume2,
  VolumeX,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { useAppAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast.jsx";
import MovieCard from "../components/MovieCard";
import PlatformIcon from "../components/PlatformIcon";
import CustomVideoPlayer from "../components/CustomVideoPlayer";
const EMPTY_ARRAY = [];

const getNumericId = (id) => id.replace(/^tmdb-(tv|movie)-/, "");

const decodeUrl = (encodedStr) => {
  if (!encodedStr || encodedStr.startsWith("http")) return encodedStr;
  try {
    const secret = import.meta.env.VITE_URL_DECODE_KEY || "STREAMLY_SECURE";
    const decodedB64 = atob(encodedStr);
    return decodedB64
      .split("")
      .map((char, i) =>
        String.fromCharCode(
          char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length),
        ),
      )
      .join("");
  } catch (e) {
    return encodedStr;
  }
};

import { VideoSourceAdapter } from "../api/videoSourceAdapter";

const SERVERS = VideoSourceAdapter.getServers();

// ─── Animation Variants ───────────────────────────────────────────────────────

// Master page entrance — staggered children
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
const pageVariants = prefersReducedMotion
  ? {}
  : {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
      },
    };

// Slide up from below
const slideUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 28, mass: 0.8 },
  },
};

// Slide up subtle (for smaller items)
const slideUpSm = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 30 },
  },
};

// Fade in only
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

// Scale + fade for cards
const cardVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 26 },
  },
};

// Similar movies grid stagger
const gridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.05 },
  },
};

// Cast rail stagger
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

// Episodes stagger
const episodesContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const episodeVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 26 },
  },
};

// ─── SeasonDropdown — custom styled dropdown (no native <select>) ─────────────

function SeasonDropdown({ seasonsCount, selectedSeason, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 20 }}>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ borderColor: "rgba(255,255,255,0.35)" }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          padding: "0.6rem 1.1rem",
          borderRadius: "12px",
          fontSize: "0.95rem",
          fontWeight: 700,
          cursor: "pointer",
          minWidth: "150px",
          justifyContent: "space-between",
          backdropFilter: "blur(8px)",
          transition: "border-color 0.2s",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f43f5e, #fb923c)",
              flexShrink: 0,
            }}
          />
          Season {selectedSeason}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          style={{ display: "flex", color: "#a1a1aa" }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: "160px",
              maxHeight: "260px",
              overflowY: "auto",
              background: "rgba(18,18,22,0.97)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "14px",
              backdropFilter: "blur(24px)",
              boxShadow: "0 20px 48px rgba(0,0,0,0.75)",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.15) transparent",
            }}
          >
            {Array.from({ length: seasonsCount }, (_, i) => i + 1).map(
              (season) => {
                const isSelected = season === selectedSeason;
                return (
                  <motion.button
                    key={season}
                    onClick={() => {
                      onSelect(season);
                      setOpen(false);
                    }}
                    whileHover={{ background: "rgba(255,255,255,0.08)" }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "0.65rem 1rem",
                      background: isSelected
                        ? "rgba(244,63,94,0.1)"
                        : "transparent",
                      border: "none",
                      color: isSelected ? "#f43f5e" : "#e4e4e7",
                      fontSize: "0.9rem",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius:
                        season === 1
                          ? "14px 14px 0 0"
                          : season === seasonsCount
                            ? "0 0 14px 14px"
                            : "0",
                      transition: "background 0.1s",
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #f43f5e, #fb923c)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {!isSelected && <span style={{ width: "6px" }} />}
                    Season {season}
                  </motion.button>
                );
              },
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ServerDropdown — custom styled dropdown for selecting servers ─────────────

function ServerDropdown({ servers, selectedIndex, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 25 }}>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ borderColor: "rgba(255,255,255,0.35)" }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          padding: "0.4rem 0.9rem",
          borderRadius: "8px",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: "pointer",
          minWidth: "130px",
          justifyContent: "space-between",
          backdropFilter: "blur(8px)",
          transition: "border-color 0.2s",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MonitorPlay size={14} color="#a1a1aa" />
          {servers[selectedIndex]?.name || "Select Server"}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          style={{ display: "flex", color: "#a1a1aa" }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: "180px",
              maxHeight: "260px",
              overflowY: "auto",
              background: "rgba(18,18,22,0.97)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              backdropFilter: "blur(24px)",
              boxShadow: "0 20px 48px rgba(0,0,0,0.75)",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.15) transparent",
              zIndex: 9999,
            }}
          >
            {servers.map((server, i) => {
              const isSelected = i === selectedIndex;
              return (
                <motion.button
                  key={i}
                  onClick={() => {
                    onSelect(i);
                    setOpen(false);
                  }}
                  whileHover={{ background: "rgba(255,255,255,0.08)" }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "0.6rem 1rem",
                    background: isSelected
                      ? "rgba(244,63,94,0.1)"
                      : "transparent",
                    border: "none",
                    color: isSelected ? "#f43f5e" : "#e4e4e7",
                    fontSize: "0.85rem",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.1s",
                  }}
                >
                  {isSelected && (
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #f43f5e, #fb923c)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {!isSelected && <span style={{ width: "6px" }} />}
                  {server.name}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MovieDetails() {
  const { id } = useParams();
  const platform = "netflix"; // Global search handles cross-platform lookups now
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState(1);
  const { isInList, toggleMyList, continueWatching, updateProgress } =
    useAppAuth();
  const { toast } = useToast();
  const cwRef = useRef(continueWatching);
  useEffect(() => {
    cwRef.current = continueWatching;
  }, [continueWatching]);

  // Wrap toggleMyList to show toast feedback
  const handleToggleMyList = (movieObj) => {
    const wasInList = isInList(movieObj.id);
    toggleMyList(movieObj);
    if (wasInList) {
      toast({
        title: "Removed from List",
        message: `"${movieObj.title}" was removed.`,
        type: "info",
        duration: 2500,
      });
    } else {
      toast({
        title: "Added to My List",
        message: `"${movieObj.title}" saved to your list.`,
        type: "success",
        duration: 2500,
      });
    }
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(false);

  const [playMode, setPlayMode] = useState("movie");
  const [playingServerIndex, setPlayingServerIndex] = useState(0);
  const [playingEpisode, setPlayingEpisode] = useState(1);

  // Trigger loading state when iframe src/key is about to change
  useEffect(() => {
    if (isPlaying) setIframeLoading(true);
  }, [isPlaying, playMode, playingServerIndex, playingEpisode, selectedSeason]);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  const castRailRef = useRef(null);
  const pageRef = useRef(null);

  // Scroll-based parallax for backdrop
  const { scrollY } = useScroll();
  const backdropY = useTransform(scrollY, [0, 600], [0, 80]);
  const backdropScale = useTransform(scrollY, [0, 600], [1, 1.08]);
  const backdropBlurValue = useTransform(scrollY, [0, 600], [0, 20]);
  const backdropBrightnessValue = useTransform(scrollY, [0, 600], [1, 0.25]);
  const backdropFilter = useMotionTemplate`blur(${backdropBlurValue}px) brightness(${backdropBrightnessValue})`;

  const scrollCast = (dir) => {
    if (castRailRef.current) {
      castRailRef.current.scrollBy({
        left: dir === "left" ? -400 : 400,
        behavior: "smooth",
      });
    }
  };

  const { data: movie, isLoading: loading } = useQuery({
    queryKey: ["movie", id, platform],
    queryFn: () => movieService.getMovieDetails(id, platform),
  });

  const { data: similarData } = useQuery({
    queryKey: ["similar", id, platform],
    queryFn: () => movieService.getSimilarMovies(id, platform),
    enabled: !!movie,
  });
  const similar = Array.isArray(similarData) ? similarData : EMPTY_ARRAY;

  const [visibleCount, setVisibleCount] = useState(12);
  useEffect(() => {
    let inThrottle;
    const handleScroll = () => {
      if (!inThrottle) {
        if (
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 800
        ) {
          setVisibleCount((prev) =>
            Math.min(prev + 12, similar ? similar.length : 0),
          );
        }
        inThrottle = true;
        setTimeout(() => (inThrottle = false), 200);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [similar]);

  const normalizedSeasonCount = Math.max(
    1,
    Number(movie?.seasonsCount) || (movie?.isSeries ? 1 : 0),
  );
  const hasSeriesEpisodes = Boolean(
    movie?.isSeries && (normalizedSeasonCount > 0 || episodesData?.length),
  );

  const { data: episodesData, isLoading: episodesLoading } = useQuery({
    queryKey: ["episodes", id, selectedSeason, platform],
    queryFn: () => movieService.getSeasonEpisodes(id, selectedSeason, platform),
    enabled: !!movie?.isSeries,
  });
  const episodes = Array.isArray(episodesData) ? episodesData : [];

  useEffect(() => {
    if (movie && movie.isSeries) {
      const saved = cwRef.current.find(
        (m) => String(m.id) === String(movie.id),
      );
      if (saved) {
        setSelectedSeason(saved.savedSeason || 1);
        setPlayingEpisode(saved.savedEpisode || 1);
      }
    }
  }, [movie]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, platform]);

  useEffect(() => {
    document.body.style.overflow = isPlaying ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isPlaying]);

  // Close player on Escape key
  useEffect(() => {
    if (!isPlaying) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setIsPlaying(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaying]);

  const [showBgTrailer, setShowBgTrailer] = useState(false);
  // isBgTrailerReady flips true only AFTER the iframe fires onLoad — this is
  // what drives all visual transitions (backdrop swap, poster/cast hide, mute btn).
  // showBgTrailer merely mounts the iframe so it can buffer silently first.
  const [isBgTrailerReady, setIsBgTrailerReady] = useState(false);
  const [isBgMuted, setIsBgMuted] = useState(true);
  const bgIframeRef = useRef(null);

  useEffect(() => {
    let timer;
    if (!loading && movie && movie.trailerUrl && !isPlaying) {
      timer = setTimeout(() => setShowBgTrailer(true), 5000);
    } else {
      setShowBgTrailer(false);
      setIsBgTrailerReady(false);
      setIsBgMuted(true);
    }
    return () => clearTimeout(timer);
  }, [loading, movie, isPlaying]);

  // Reset ready state when trailer is unmounted
  useEffect(() => {
    if (!showBgTrailer) setIsBgTrailerReady(false);
  }, [showBgTrailer]);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(e.data);
        if (data.event === "onStateChange" && data.info === 0) {
          setShowBgTrailer(false);
          setIsBgTrailerReady(false);
        } else if (
          data.event === "infoDelivery" &&
          data.info &&
          data.info.playerState === 0
        ) {
          setShowBgTrailer(false);
          setIsBgTrailerReady(false);
        }
      } catch (err) {}
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (loading) {
    return <MovieDetailsSkeleton />;
  }

  if (!movie) {
    return (
      <div className="loading-container">
        <h2>Movie not found.</h2>
      </div>
    );
  }

  let resolvedPlatform = platform;
  if (movie.availablePlatforms && movie.availablePlatforms.length > 0) {
    const ap = movie.availablePlatforms[0].toLowerCase();
    if (ap.includes("prime")) resolvedPlatform = "prime";
    else if (ap.includes("netflix")) resolvedPlatform = "netflix";
    else if (ap.includes("hotstar")) resolvedPlatform = "hotstar";
    else if (ap.includes("apple")) resolvedPlatform = "appletv";
    else if (ap.includes("zee5")) resolvedPlatform = "zee5";
    else if (ap.includes("sony")) resolvedPlatform = "sonyliv";
    else if (ap.includes("jio")) resolvedPlatform = "jio";
  }
  const sourceName =
    resolvedPlatform === "netflix"
      ? "Netflix"
      : resolvedPlatform === "prime"
        ? "Prime Video"
        : resolvedPlatform === "hotstar"
          ? "Hotstar"
          : resolvedPlatform === "appletv"
            ? "Apple TV+"
            : resolvedPlatform === "zee5"
              ? "Zee5"
              : resolvedPlatform === "sonyliv"
                ? "Sony LIV"
                : "JioCinema";

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0)
      return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Derived: true if user has any watch progress for this movie
  const hasProgress = continueWatching?.some((m) => m.id === movie?.id);
  const progressItem = continueWatching?.find((m) => m.id === movie?.id);
  const savedTimestamp = progressItem?.timestamp || 0;

  return (
    <div
      ref={pageRef}
      style={{
        position: "relative",
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        marginTop: "-2rem",
        paddingTop: "2rem",
      }}
    >
      <SEO
        title={movie.title}
        description={movie.description}
        image={movie.backdropUrl || movie.posterUrl}
        type="video.movie"
      />

      {/* ── Backdrop ─────────────────────────────────────────────────────────── */}
      <div
        className="details-backdrop"
        style={{
          height: "min(86vh, 980px)",
          overflow: "hidden",
          top: "0",
          left: "50%",
          width: "100vw",
          transform: "translateX(-50%)",
          marginTop: "-2rem",
        }}
      >
        <AnimatePresence mode="wait">
          {!isBgTrailerReady ? (
            <motion.img
              key="bg-img"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              src={movie.backdropUrl || movie.posterUrl}
              alt="Backdrop"
              style={{
                y: backdropY,
                scale: backdropScale,
                filter: backdropFilter,
              }}
              onError={(e) => {
                e.currentTarget.style.opacity = "0";
              }}
            />
          ) : (
            <motion.div
              key="bg-video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            />
          )}
        </AnimatePresence>

        {/* Iframe: mounted silently as soon as showBgTrailer fires so it buffers;
            visually revealed only once isBgTrailerReady=true (onLoad fired) */}
        {showBgTrailer && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: isBgTrailerReady ? 1 : 0,
              transition: isBgTrailerReady
                ? "opacity 1.8s ease-in-out"
                : "none",
            }}
          >
            <iframe
              ref={bgIframeRef}
              src={`${decodeUrl(movie.trailerUrl)}&controls=0&mute=1&autoplay=1&enablejsapi=1`}
              style={{
                width: "100vw",
                height: "56.25vw",
                minHeight: "100vh",
                minWidth: "177.77vh",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(1.3)",
                border: "none",
              }}
              allow="autoplay; encrypted-media"
              onLoad={() => {
                if (bgIframeRef.current?.contentWindow) {
                  bgIframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: "listening" }),
                    "*",
                  );
                }
                // Small delay so the video has a moment to start painting before we reveal it
                setTimeout(() => setIsBgTrailerReady(true), 800);
              }}
            />
          </div>
        )}

        {/* Side vignettes */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.85) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Top fade */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "120px",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "55%",
            background:
              "linear-gradient(to top, #000000 0%, rgba(0,0,0,0.92) 25%, rgba(0,0,0,0.6) 55%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Topbar: Back + Mute ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
        style={{
          position: "relative",
          zIndex: 10,
          paddingTop: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingRight: "2rem",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#d4d4d8",
            fontWeight: 600,
            transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
            textTransform: "uppercase",
            fontSize: "0.85rem",
            letterSpacing: "0.05em",
            background: "rgba(0,0,0,0.55)",
            padding: "10px 20px",
            borderRadius: "100px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            cursor: "pointer",
          }}
          className="back-link"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .back-link:hover { color: #fff !important; background: rgba(255,255,255,0.12) !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important; }
        `,
          }}
        />

        <AnimatePresence>
          {isBgTrailerReady && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={() => {
                if (bgIframeRef.current?.contentWindow) {
                  bgIframeRef.current.contentWindow.postMessage(
                    JSON.stringify({
                      event: "command",
                      func: isBgMuted ? "unMute" : "mute",
                    }),
                    "*",
                  );
                }
                setIsBgMuted(!isBgMuted);
              }}
              style={{
                zIndex: 50,
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                padding: "0.8rem",
                borderRadius: "50%",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              whileHover={{ scale: 1.12, background: "rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.93 }}
            >
              {isBgMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Main Content Block ────────────────────────────────────────────────── */}
      <motion.div
        className="details-content-wrapper"
        variants={pageVariants}
        initial="hidden"
        animate="show"
      >
        {/* Poster */}
        <AnimatePresence mode="wait">
          {!isBgTrailerReady && (
            <motion.div
              key="poster"
              variants={slideUp}
              exit={{
                opacity: 0,
                scale: 0.88,
                x: -30,
                transition: { duration: 0.5, ease: [0.4, 0, 1, 1] },
              }}
              style={{ position: "relative", flexShrink: 0 }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "-12%",
                  background: `url(${movie.posterUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(48px) brightness(0.5)",
                  zIndex: -1,
                  borderRadius: "50%",
                  opacity: 0.8,
                }}
              />
              <motion.img
                src={movie.posterUrl}
                alt={movie.title}
                className="details-poster-large"
                whileHover={{
                  scale: 1.03,
                  y: -6,
                  boxShadow: "0 40px 80px -12px rgba(0,0,0,0.95)",
                }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                onError={(e) => {
                  e.currentTarget.style.opacity = "0";
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text content */}
        <motion.div
          className="details-text"
          layout
          style={{
            display: "flex",
            flexDirection: isBgTrailerReady ? "row" : "column",
            width: "100%",
            alignItems: isBgTrailerReady ? "flex-end" : "stretch",
            gap: isBgTrailerReady ? "2rem" : "0",
            paddingTop: isBgTrailerReady ? "10vh" : 0,
            transition: "padding-top 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <motion.div
            layout
            style={{
              display: "flex",
              flexDirection: "column",
              width: isBgTrailerReady ? "40%" : "100%",
            }}
          >
            {/* Platform tag */}
            <AnimatePresence>
              {!isBgTrailerReady && (
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="show"
                  exit={{
                    opacity: 0,
                    height: 0,
                    marginBottom: 0,
                    overflow: "hidden",
                    transition: { duration: 0.45 },
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                    style={{
                      marginBottom: "1.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <PlatformIcon platform={resolvedPlatform} />
                  </motion.div>

                  {movie.nextEpisode && movie.nextEpisode.releaseDate && (
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.3,
                        duration: 0.4,
                        ease: "easeOut",
                      }}
                      style={{
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          background: "#e50914",
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          animation: "pulse 2s infinite",
                        }}
                      >
                        LIVE SEASON
                      </span>
                      <span
                        style={{
                          color: "#d4d4d8",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                        }}
                      >
                        New Episode Airs on{" "}
                        {new Date(
                          movie.nextEpisode.releaseDate,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logo / Title */}
            <motion.div
              layout
              style={{
                marginBottom: "1.5rem",
                minHeight: "80px",
                display: "flex",
                alignItems: "center",
              }}
              variants={slideUp}
            >
              {movie.logoUrl ? (
                <motion.img
                  src={movie.logoUrl}
                  alt={movie.title}
                  style={{
                    maxWidth: "400px",
                    maxHeight: "140px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.7))",
                  }}
                  initial={{
                    opacity: 0,
                    y: 20,
                    filter: "drop-shadow(0 6px 16px rgba(0,0,0,0)) blur(4px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.7)) blur(0px)",
                  }}
                  transition={{
                    delay: 0.25,
                    duration: 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <motion.h1
                  style={{
                    fontSize: "clamp(2.5rem, 4vw, 4.5rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    margin: 0,
                  }}
                  initial={{ opacity: 0, y: 24, letterSpacing: "0.02em" }}
                  animate={{ opacity: 1, y: 0, letterSpacing: "-0.04em" }}
                  transition={{
                    delay: 0.2,
                    duration: 0.65,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {movie.title}
                </motion.h1>
              )}
            </motion.div>

            {/* Meta + genres + description */}
            <AnimatePresence>
              {!isBgTrailerReady && (
                <motion.div
                  variants={slideUp}
                  initial="hidden"
                  animate="show"
                  exit={{
                    opacity: 0,
                    height: 0,
                    overflow: "hidden",
                    transition: { duration: 0.5, ease: [0.4, 0, 1, 1] },
                  }}
                >
                  {/* Meta pills */}
                  <motion.div
                    className="details-meta"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "1.75rem",
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      color: "#a1a1aa",
                    }}
                    variants={{
                      show: { transition: { staggerChildren: 0.06 } },
                    }}
                    initial="hidden"
                    animate="show"
                  >
                    {[
                      {
                        icon: <Calendar size={15} />,
                        label:
                          movie.isUpcoming && movie.releaseDate
                            ? new Date(movie.releaseDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : movie.releaseYear,
                        bg: "rgba(255,255,255,0.06)",
                      },
                      {
                        icon: <Clock size={15} />,
                        label:
                          movie.duration ||
                          (movie.isSeries ? "Series" : "Movie"),
                        bg: "rgba(255,255,255,0.06)",
                      },
                      ...(movie.imdbRating > 0
                        ? [
                            {
                              icon: "⭐",
                              label: movie.imdbRating,
                              bg: "rgba(251,191,36,0.1)",
                              color: "#fbbf24",
                            },
                          ]
                        : []),
                      {
                        icon: <Star size={15} fill="#fbbf24" color="#fbbf24" />,
                        label: movie.maturityRating || "PG",
                        bg: "rgba(251,191,36,0.08)",
                        color: "#fbbf24",
                      },
                      ...(movie.matchScore
                        ? [
                            {
                              label: `${movie.matchScore}% Match`,
                              bg: "rgba(74,222,128,0.1)",
                              color: "#4ade80",
                            },
                          ]
                        : []),
                    ].map((item, i) => (
                      <motion.span
                        key={i}
                        variants={slideUpSm}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          background: item.bg || "rgba(255,255,255,0.06)",
                          padding: "5px 11px",
                          borderRadius: "8px",
                          color: item.color || "#a1a1aa",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        {item.icon} {item.label}
                      </motion.span>
                    ))}
                  </motion.div>

                  {/* Genre tags */}
                  <motion.div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginBottom: "1.75rem",
                    }}
                    variants={{
                      show: { transition: { staggerChildren: 0.05 } },
                    }}
                    initial="hidden"
                    animate="show"
                  >
                    {(movie.genres || []).map((genre, i) => (
                      <motion.div
                        key={genre}
                        variants={slideUpSm}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Link
                          to={`/genre/${encodeURIComponent(genre)}`}
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.18)",
                            padding: "4px 14px",
                            borderRadius: "100px",
                            fontSize: "0.8rem",
                            color: "#d4d4d8",
                            letterSpacing: "0.03em",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            textDecoration: "none",
                            display: "inline-block",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,0.4)";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,0.18)";
                            e.currentTarget.style.color = "#d4d4d8";
                          }}
                        >
                          {genre}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Description */}
                  <motion.p
                    className="details-overview"
                    style={{
                      fontSize: "1.05rem",
                      lineHeight: 1.85,
                      color: "#d4d4d8",
                      letterSpacing: "0.01em",
                      marginBottom: "2.5rem",
                      width: "100%",
                      paddingRight: "2rem",
                    }}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.6, ease: "easeOut" }}
                  >
                    {movie.longDescription || movie.description}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA Buttons */}
            <motion.div
              layout
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.85rem",
                marginBottom: isBgTrailerReady ? "0" : "3.5rem",
              }}
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              initial="hidden"
              animate="show"
            >
              {[
                ...(movie.isUpcoming || SERVERS.length === 0
                  ? []
                  : [
                      {
                        cls: `btn btn-primary${!hasProgress ? " btn-cta-pulse" : ""}`,
                        style: { fontSize: "1.05rem", padding: "1rem 2rem" },
                        onClick: () => {
                          setPlayMode("movie");
                          setIsPlaying(true);
                          if (progressItem && progressItem.timestamp > 0) {
                            if (movie.isSeries) {
                              setSelectedSeason(progressItem.savedSeason || 1);
                              setPlayingEpisode(progressItem.savedEpisode || 1);
                            }
                          } else {
                            setPlayingEpisode(1);
                            if (movie.isSeries) setSelectedSeason(1);
                            updateProgress(
                              {
                                ...movie,
                                source: resolvedPlatform,
                                sourceName,
                              },
                              movie.isSeries ? 1 : null,
                              movie.isSeries ? 1 : null,
                              0,
                            );
                          }
                          TelemetryAdapter.trackPlay(
                            movie.id,
                            movie.title,
                            resolvedPlatform,
                          );
                        },
                        children: (
                          <>
                            <Play size={20} fill="currentColor" stroke="none" />{" "}
                            {savedTimestamp > 0
                              ? `Continue (${formatTime(savedTimestamp)})`
                              : "Play Now"}
                          </>
                        ),
                      },
                      ...(savedTimestamp > 0
                        ? [
                            {
                              cls: "btn",
                              style: {
                                fontSize: "1.05rem",
                                padding: "1rem 2rem",
                                background: "rgba(255,255,255,0.1)",
                                color: "#fff",
                              },
                              onClick: () => {
                                setPlayMode("movie");
                                setIsPlaying(true);
                                setPlayingEpisode(1);
                                if (movie.isSeries) setSelectedSeason(1);
                                updateProgress(
                                  {
                                    ...movie,
                                    source: resolvedPlatform,
                                    sourceName,
                                  },
                                  movie.isSeries ? 1 : null,
                                  movie.isSeries ? 1 : null,
                                  0,
                                );
                                TelemetryAdapter.trackPlay(
                                  movie.id,
                                  movie.title,
                                  resolvedPlatform,
                                );
                              },
                              children: (
                                <>
                                  <RotateCcw size={20} /> Start Over
                                </>
                              ),
                            },
                          ]
                        : []),
                    ]),
                ...(movie.isUpcoming && movie.trailerUrl
                  ? [
                      {
                        cls: "btn btn-primary",
                        style: { fontSize: "1.05rem", padding: "1rem 2rem" },
                        onClick: () => {
                          setPlayMode("trailer");
                          setIsPlaying(true);
                          TelemetryAdapter.trackPlay(
                            movie.id,
                            movie.title,
                            "Trailer",
                          );
                        },
                        children: (
                          <>
                            <Play size={20} fill="currentColor" stroke="none" />{" "}
                            Watch Trailer
                          </>
                        ),
                      },
                    ]
                  : []),
                {
                  cls: "btn btn-glass",
                  style: { fontSize: "1.05rem", padding: "1rem 2rem" },
                  onClick: () => handleToggleMyList(movie),
                  children: (
                    <>
                      {isInList(movie.id) ? (
                        <Check size={20} color="#4ade80" />
                      ) : (
                        <Plus size={20} />
                      )}{" "}
                      {isInList(movie.id) ? "Added" : "My List"}
                    </>
                  ),
                },
                ...(!movie.isUpcoming && movie.trailerUrl
                  ? [
                      {
                        cls: "btn btn-glass",
                        style: {
                          fontSize: "1.05rem",
                          padding: "1rem 2rem",
                          background: "transparent",
                          borderColor: "rgba(255,255,255,0.25)",
                        },
                        onClick: () => {
                          setPlayMode("trailer");
                          setIsPlaying(true);
                        },
                        children: <>Watch Trailer</>,
                      },
                    ]
                  : []),
              ].map((btn, i) => (
                <motion.button
                  key={i}
                  variants={slideUpSm}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className={btn.cls}
                  style={btn.style}
                  onClick={btn.onClick}
                >
                  {btn.children}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Director + cast — hidden while bg trailer plays */}
          <AnimatePresence>
            {!isBgTrailerReady && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: { duration: 0.35, ease: [0.4, 0, 1, 1] },
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "2rem",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  paddingTop: "2rem",
                  width: "100%",
                }}
              >
                <motion.div variants={fadeIn}>
                  {movie.director && (
                    <motion.div
                      style={{ marginBottom: "1.5rem" }}
                      variants={slideUpSm}
                    >
                      <h3
                        style={{
                          fontSize: "0.8rem",
                          color: "#52525b",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: "0.6rem",
                        }}
                      >
                        Director
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 500,
                          color: "#e4e4e7",
                          fontSize: "1rem",
                        }}
                      >
                        {movie.director}
                      </p>
                    </motion.div>
                  )}
                  {movie.isSeries && movie.seasonsCount && (
                    <motion.div variants={slideUpSm}>
                      <h3
                        style={{
                          fontSize: "0.8rem",
                          color: "#52525b",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: "0.6rem",
                        }}
                      >
                        Series Info
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 500,
                          color: "#e4e4e7",
                          fontSize: "1rem",
                        }}
                      >
                        {movie.seasonsCount} Season
                        {movie.seasonsCount > 1 ? "s" : ""}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
                {movie.cast && movie.cast.length > 0 && (
                  <div style={{ gridColumn: "span 2", minWidth: 0 }}>
                    <CastRail cast={movie.cast} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* ── Episodes ─────────────────────────────────────────────────────────── */}
      {movie.isSeries && hasSeriesEpisodes && (
        <motion.section
          style={{ marginTop: "2rem" }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <motion.h2
              className="section-title"
              style={{ margin: 0 }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              Episodes
            </motion.h2>

            {/* Season custom dropdown */}
            <SeasonDropdown
              seasonsCount={normalizedSeasonCount}
              selectedSeason={selectedSeason}
              onSelect={setSelectedSeason}
            />
          </div>

          {/* Episode Grid */}
          <motion.div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
              gap: "1.5rem",
            }}
            key={`season-${selectedSeason}-${episodesLoading}`}
            variants={episodesContainerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {episodesLoading ? (
              // Skeleton placeholders while episodes load
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#0a0a0d",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ width: "100%", aspectRatio: "16/9" }}
                  ></div>
                  <div
                    style={{ padding: "1.2rem", display: "flex", gap: "10px" }}
                  >
                    <div
                      className="skeleton"
                      style={{
                        height: "1.5rem",
                        width: "2rem",
                        borderRadius: "4px",
                      }}
                    ></div>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem",
                      }}
                    >
                      <div
                        className="skeleton"
                        style={{
                          height: "1.1rem",
                          width: "70%",
                          borderRadius: "4px",
                        }}
                      ></div>
                      <div
                        className="skeleton"
                        style={{
                          height: "0.8rem",
                          width: "100%",
                          borderRadius: "4px",
                        }}
                      ></div>
                      <div
                        className="skeleton"
                        style={{
                          height: "0.8rem",
                          width: "80%",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : episodes.length === 0 ? (
              <p
                style={{
                  color: "#52525b",
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "3rem 0",
                  fontSize: "1.1rem",
                }}
              >
                No episodes found for this season.
              </p>
            ) : (
              episodes.map((ep, idx) => {
                const isEpPlaying =
                  isPlaying &&
                  playingEpisode === ep.episodeNumber &&
                  playMode !== "trailer";
                return (
                  <motion.div
                    key={ep.id || idx}
                    variants={episodeVariants}
                    initial="rest"
                    whileHover="hover"
                    animate="rest"
                    onClick={() => {
                      if (SERVERS.length > 0) {
                        setIsPlaying(true);
                        setPlayingEpisode(ep.episodeNumber);
                        updateProgress(
                          { ...movie, source: resolvedPlatform, sourceName },
                          selectedSeason,
                          ep.episodeNumber,
                        );
                        TelemetryAdapter.trackPlay(
                          movie.id,
                          movie.title,
                          resolvedPlatform,
                        );
                      }
                    }}
                    style={{
                      background: isEpPlaying
                        ? "linear-gradient(180deg, rgba(244,63,94,0.1) 0%, rgba(9,9,11,1) 100%)"
                        : "#09090b",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: isEpPlaying
                        ? "1px solid rgba(244,63,94,0.4)"
                        : "1px solid rgba(255,255,255,0.05)",
                      cursor: SERVERS.length > 0 ? "pointer" : "default",
                      opacity: SERVERS.length > 0 ? 1 : 0.6,
                      position: "relative",
                      boxShadow: isEpPlaying
                        ? "0 10px 30px -10px rgba(244,63,94,0.15)"
                        : "0 10px 30px -10px rgba(0,0,0,0.5)",
                      transition:
                        "border 0.3s ease, background 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        aspectRatio: "16/9",
                        background: "#18181b",
                        overflow: "hidden",
                      }}
                    >
                      {ep.thumbnailUrl && (
                        <motion.img
                          src={ep.thumbnailUrl}
                          alt={ep.title}
                          variants={{
                            rest: { scale: 1 },
                            hover: { scale: 1.08 },
                          }}
                          transition={{
                            duration: 0.6,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          loading="lazy"
                          decoding="async"
                        />
                      )}

                      {/* Hover Overlay Gradient */}
                      <motion.div
                        variants={{
                          rest: { opacity: 0 },
                          hover: { opacity: 1 },
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 100%)",
                        }}
                      />

                      {/* Play Button */}
                      <motion.div
                        variants={{
                          rest: { opacity: 0, scale: 0.8, y: 10 },
                          hover: { opacity: 1, scale: 1, y: 0 },
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "54px",
                            height: "54px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #f43f5e, #fb923c)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            boxShadow: "0 8px 24px rgba(244,63,94,0.5)",
                          }}
                        >
                          <Play
                            size={24}
                            fill="currentColor"
                            stroke="none"
                            style={{ marginLeft: "4px" }}
                          />
                        </div>
                      </motion.div>

                      {/* Tags */}
                      {isEpPlaying && (
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background:
                              "linear-gradient(135deg, #f43f5e, #fb923c)",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            zIndex: 10,
                            boxShadow: "0 4px 12px rgba(244,63,94,0.3)",
                          }}
                        >
                          Playing
                        </div>
                      )}
                      <motion.div
                        variants={{
                          rest: { opacity: 1 },
                          hover: { opacity: 0 },
                        }}
                        style={{
                          position: "absolute",
                          bottom: "10px",
                          right: "10px",
                          background: "rgba(0,0,0,0.75)",
                          backdropFilter: "blur(4px)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {ep.duration}
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div
                      style={{
                        padding: "1.2rem",
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "1.3rem",
                            fontWeight: 800,
                            color: isEpPlaying ? "#f43f5e" : "#3f3f46",
                            lineHeight: 1,
                            fontFamily: "monospace",
                          }}
                        >
                          {String(ep.episodeNumber).padStart(2, "0")}
                        </span>
                        <div>
                          <h3
                            style={{
                              fontSize: "1.05rem",
                              fontWeight: 600,
                              margin: "0 0 0.5rem",
                              lineHeight: 1.3,
                              color: isEpPlaying ? "#fff" : "#e4e4e7",
                              transition: "color 0.2s",
                            }}
                          >
                            {ep.title}
                          </h3>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "#a1a1aa",
                              margin: 0,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              lineHeight: 1.6,
                            }}
                          >
                            {ep.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </motion.section>
      )}

      {/* ── More Like This ────────────────────────────────────────────────────── */}
      {(loading || (similar && similar.length > 0)) && (
        <motion.section
          style={{ marginTop: "5rem" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            More Like This
          </motion.h2>
          {loading ? (
            <div className="movie-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div
                    className="skeleton"
                    style={{
                      width: "100%",
                      aspectRatio: "2/3",
                      borderRadius: "12px",
                      marginBottom: "0.5rem",
                    }}
                  ></div>
                  <div
                    className="skeleton"
                    style={{
                      height: "1rem",
                      width: "70%",
                      borderRadius: "4px",
                      marginBottom: "0.4rem",
                    }}
                  ></div>
                  <div
                    className="skeleton"
                    style={{
                      height: "0.8rem",
                      width: "40%",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="movie-grid"

              viewport={{ once: true, margin: "-100px" }}
            >
              {similar.slice(0, visibleCount).map((sim, idx) => (
                <motion.div
                  key={`${sim.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: (idx % 12) * 0.05,
                    ease: "easeOut",
                  }}
                >
                  <MovieCard
                    movie={{ ...sim, source: sim.source || resolvedPlatform }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.section>
      )}

      {/* ── Video Player Overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              background: playMode === "trailer" ? "rgba(0,0,0,0.92)" : "#000",
              backdropFilter: playMode === "trailer" ? "blur(24px)" : "none",
            }}
          >
            {playMode === "trailer" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.12 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  zIndex: -1,
                }}
              />
            )}

            {/* Player header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
              className="video-modal-header"
              style={{
                position: "relative",
                padding: "1.25rem 2rem",
                display: "flex",
                justifyContent: "space-between",
                background:
                  playMode === "trailer" ? "rgba(0,0,0,0.4)" : "#09090b",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                zIndex: 1000,
                backdropFilter: playMode === "trailer" ? "blur(12px)" : "none",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <motion.button
                  onClick={() => setIsPlaying(false)}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    padding: "0.5rem 1rem",
                    borderRadius: "100px",
                  }}
                  whileHover={{
                    background: "rgba(255,255,255,0.16)",
                    scale: 1.03,
                  }}
                  whileTap={{ scale: 0.96 }}
                >
                  <ArrowLeft size={18} /> Back
                </motion.button>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#e4e4e7",
                  }}
                >
                  {movie.title}{" "}
                  {playMode === "trailer" ? (
                    <span style={{ color: "#71717a", fontWeight: 400 }}>
                      — Official Trailer
                    </span>
                  ) : movie.isSeries ? (
                    `— S${selectedSeason} E${playingEpisode}${episodes.find((e) => e.episodeNumber === playingEpisode)?.title ? `: ${episodes.find((e) => e.episodeNumber === playingEpisode).title}` : ""}`
                  ) : (
                    ""
                  )}
                </h3>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                {movie.isSeries && playMode !== "trailer" && (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginRight: "0.75rem",
                    }}
                  >
                    <motion.button
                      onClick={() => {
                        if (playingEpisode > 1) {
                          setPlayingEpisode((prev) => prev - 1);
                        }
                      }}
                      disabled={playingEpisode <= 1}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        color: "white",
                        padding: "0.5rem 1rem",
                        borderRadius: "8px",
                        cursor: playingEpisode <= 1 ? "not-allowed" : "pointer",
                        opacity: playingEpisode <= 1 ? 0.4 : 1,
                      }}
                      whileHover={playingEpisode > 1 ? { scale: 1.04 } : {}}
                      whileTap={playingEpisode > 1 ? { scale: 0.95 } : {}}
                    >
                      Prev Ep
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        if (playingEpisode < episodes.length) {
                          setPlayingEpisode((prev) => prev + 1);
                        }
                      }}
                      disabled={playingEpisode >= episodes.length}
                      style={{
                        background: "linear-gradient(135deg, #f43f5e, #fb923c)",
                        border: "none",
                        color: "white",
                        padding: "0.5rem 1.1rem",
                        borderRadius: "8px",
                        cursor:
                          playingEpisode >= episodes.length
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: 700,
                        opacity: playingEpisode >= episodes.length ? 0.4 : 1,
                      }}
                      whileHover={
                        playingEpisode < episodes.length
                          ? { scale: 1.05, background: "#ff0a16" }
                          : {}
                      }
                      whileTap={
                        playingEpisode < episodes.length ? { scale: 0.95 } : {}
                      }
                    >
                      Next Ep
                    </motion.button>
                  </div>
                )}
                {playMode !== "trailer" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <ServerDropdown
                      servers={SERVERS}
                      selectedIndex={playingServerIndex}
                      onSelect={setPlayingServerIndex}
                    />
                  </div>
                )}
                {playMode === "trailer" && (
                  <motion.button
                    onClick={() => setIsPlaying(false)}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      marginLeft: "0.25rem",
                    }}
                    whileHover={{
                      background: "rgba(255,255,255,0.18)",
                      scale: 1.1,
                    }}
                    whileTap={{ scale: 0.9 }}
                    title="Close Trailer"
                  >
                    <X size={18} />
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Player: iframe for trailer, CustomVideoPlayer for streams */}
            <motion.div
              style={{
                position: "relative",
                flex: 1,
                width: "100%",
                background: "#000",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {playMode === "trailer" ? (
                <>
                  {iframeLoading && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: -1,
                      }}
                    >
                      <Loader variant="inline" size="40px" />
                      <span
                        style={{
                          marginTop: "1rem",
                          color: "#a1a1aa",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                        }}
                      >
                        Loading trailer...
                      </span>
                    </div>
                  )}
                  <iframe
                    src={decodeUrl(movie.trailerUrl)}
                    onLoad={() => setIframeLoading(false)}
                    style={{
                      width: "100%",
                      height: "min(calc(100vw * 9/16), calc(100vh - 120px))",
                      maxWidth: "min(1400px, calc((100vh - 120px) * 16/9))",
                      border: "none",
                      borderRadius: "20px",
                      boxShadow: "0 32px 64px -12px rgba(0,0,0,0.9)",
                      opacity: iframeLoading ? 0 : 1,
                      transition: "opacity 0.4s ease",
                    }}
                  />
                </>
              ) : (
                <CustomVideoPlayer
                  movie={movie}
                  season={movie.isSeries ? selectedSeason : undefined}
                  episode={movie.isSeries ? playingEpisode : undefined}
                  preferredServerIndex={playingServerIndex}
                  onServerChange={setPlayingServerIndex}
                  onClose={() => setIsPlaying(false)}
                  thumbnailUrl={movie.backdropUrl || movie.posterUrl}
                  startTime={savedTimestamp}
                  hasNextEpisode={
                    movie.isSeries && playingEpisode < episodes.length
                  }
                  onNextEpisode={() => {
                    if (playingEpisode < episodes.length) {
                      setPlayingEpisode((prev) => prev + 1);
                    }
                  }}
                  onProgressUpdate={(currentTime, duration) => {
                    if (duration > 0 && currentTime > 10) {
                      updateProgress(
                        { ...movie, source: resolvedPlatform, sourceName },
                        selectedSeason,
                        playingEpisode,
                        currentTime,
                      );
                    }
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
