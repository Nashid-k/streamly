import SEO from "../components/SEO";
import slugify from "slugify";
import ErrorBoundary from "../components/ErrorBoundary";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Play, ChevronLeft, ChevronRight, Check, Plus } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { useAppAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { movieService } from "../api/movieService";
import MovieCard from "../components/MovieCard";
import PlatformIcon from "../components/PlatformIcon";

const GENRE_OPTIONS = [
  "All",
  "Malayalam",
  "Tamil",
  "Hindi",
  "Action",
  "Drama",
  "Comedy",
  "Thriller",
  "Horror",
  "Sci-Fi",
  "Romance",
  "Animation",
  "Crime",
  "Mystery",
  "Adventure",
  "Fantasy",
];

// ... (skipping MovieRail and Top10Rail for brevity, they remain unchanged)
const FadeInSection = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

// The prompt requires me to replace the entire chunk up to line 333, but I need to make sure I don't delete MovieRail and Top10Rail. Let's write the whole chunk.

const MovieRail = React.memo(
  function MovieRail({ category, railIndex = 0 }) {
    const railRef = useRef(null);
    const containerRef = useRef(null);
    const [showArrows, setShowArrows] = useState(false);
    const [inView, setInView] = useState(false);
    const isDynamicRail =
      category.name === "Continue Watching" ||
      category.name === "My List" ||
      category.name.startsWith("Because you watched");

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: "300px 0px" },
      );
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      return () => observer.disconnect();
    }, []);

    const [visibleCount, setVisibleCount] = useState(10);
    const inThrottle = useRef(false);

    useEffect(() => {
      setVisibleCount(10);
      if (railRef.current) {
        railRef.current.scrollLeft = 0;
      }
    }, [category.name]);

    const handleScroll = (e) => {
      if (inThrottle.current) return;
      const { scrollLeft, clientWidth, scrollWidth } = e.target;
      if (scrollLeft + clientWidth >= scrollWidth - 400) {
        setVisibleCount((prev) =>
          prev >= category.movies.length
            ? prev
            : Math.min(prev + 10, category.movies.length),
        );
      }
      inThrottle.current = true;
      setTimeout(() => (inThrottle.current = false), 150);
    };

    const scroll = (dir) => {
      if (railRef.current) {
        const clientWidth = railRef.current.clientWidth;
        const scrollAmount =
          clientWidth > 800 ? clientWidth * 0.8 : clientWidth * 0.9;
        railRef.current.scrollBy({
          left: dir === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    };

    if (!category?.movies || category.movies.length === 0) return null;

    return (
      <div
        ref={containerRef}
        className="movie-rail-wrapper"
        onMouseEnter={() => setShowArrows(true)}
        onMouseLeave={() => setShowArrows(false)}
        style={{ position: "relative" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.25rem",
            paddingLeft: "0.25rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {category.name}
          </h3>
          {!isDynamicRail && (
            <Link
              to={`/category/${encodeURIComponent(category.name)}`}
              style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.35)",
                textDecoration: "none",
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: "4px",
                border: "none",
                transition: "color 0.2s",
                background: "transparent",
              }}
            >
              Show all ›
            </Link>
          )}
        </div>

        {inView && (
          <>
            <AnimatePresence>
              {showArrows && (
                <>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => scroll("left")}
                    style={{
                      position: "absolute",
                      left: "-16px",
                      top: "calc(50% + 8px)",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      background: "rgba(5,5,5,0.85)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                    }}
                  >
                    <ChevronLeft size={18} />
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => scroll("right")}
                    style={{
                      position: "absolute",
                      right: "-16px",
                      top: "calc(50% + 8px)",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      background: "rgba(5,5,5,0.85)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                    }}
                  >
                    <ChevronRight size={18} />
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            <div
              ref={railRef}
              className="movie-rail"
              onScroll={handleScroll}
              style={{
                display: "flex",
                gap: "0.5rem",
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorX: "contain",
                overflowX: "auto",
                scrollbarWidth: "none",
                padding: "0.25rem 0.25rem",
              }}
            >
              {category.movies.slice(0, visibleCount).map((movie, i) => (
                <motion.div
                  key={`${movie.id}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10px" }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min((i % 10) * 0.03, 0.15),
                    ease: "easeOut",
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <div style={{ width: "180px" }}>
                    <MovieCard movie={movie} />
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.category.name === next.category.name &&
    prev.category.movies === next.category.movies,
);

const Top10Rail = React.memo(
  function Top10Rail({ movies, filter, railIndex = 0 }) {
    const railRef = useRef(null);
    const containerRef = useRef(null);
    const [showArrows, setShowArrows] = useState(false);
    const [inView, setInView] = useState(false);
    const top10 = movies.slice(0, 10);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: "300px 0px" },
      );
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (railRef.current) {
        railRef.current.scrollLeft = 0;
      }
    }, [filter]);

    const scroll = (dir) => {
      if (railRef.current) {
        const clientWidth = railRef.current.clientWidth;
        const scrollAmount =
          clientWidth > 800 ? clientWidth * 0.8 : clientWidth * 0.9;
        railRef.current.scrollBy({
          left: dir === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    };

    if (top10.length === 0) return null;

    return (
      <div
        ref={containerRef}
        className="movie-rail-wrapper"
        onMouseEnter={() => setShowArrows(true)}
        onMouseLeave={() => setShowArrows(false)}
        style={{ position: "relative" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.25rem",
            paddingLeft: "0.25rem",
          }}
        >
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: "#e50914", marginRight: "6px" }}>Top 10</span>
          {filter === "series" || filter === "tv shows"
            ? "TV Shows"
            : filter === "movies"
              ? "Movies"
              : "Today"}
        </h3>
        </div>

        {inView && (
          <>
            <AnimatePresence>
              {showArrows && (
                <>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => scroll("left")}
                    style={{
                      position: "absolute",
                      left: "-16px",
                      top: "calc(50% + 8px)",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      background: "rgba(5,5,5,0.85)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                    }}
                  >
                    <ChevronLeft size={18} />
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => scroll("right")}
                    style={{
                      position: "absolute",
                      right: "-16px",
                      top: "calc(50% + 8px)",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      background: "rgba(5,5,5,0.85)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                    }}
                  >
                    <ChevronRight size={18} />
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            <div
              ref={railRef}
              className="movie-rail"
              style={{
                display: "flex",
                gap: "1rem",
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorX: "contain",
                overflowX: "auto",
                scrollbarWidth: "none",
                padding: "0.25rem 0.25rem",
              }}
            >
              {top10.map((movie, i) => (
                <motion.div
                  key={`top10-${movie.id}`}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10px" }}
                  transition={{
                    duration: 0.5,
                    delay: (railIndex % 4) * 0.15 + i * 0.05,
                    ease: "easeOut",
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-end",
                      width: "180px",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-8px",
                        left: "-18px",
                        fontSize: "7rem",
                        fontWeight: 900,
                        lineHeight: 1,
                        zIndex: 2,
                        pointerEvents: "none",
                        userSelect: "none",
                        color:
                          i === 0
                            ? "rgba(251,191,36,0.12)"
                            : i === 1
                              ? "rgba(148,163,184,0.12)"
                              : i === 2
                                ? "rgba(201,124,74,0.12)"
                                : "rgba(255,255,255,0.04)",
                        WebkitTextStroke:
                          "2px " +
                          (i === 0
                            ? "#fbbf24"
                            : i === 1
                              ? "#94a3b8"
                              : i === 2
                                ? "#c97c4a"
                                : "rgba(255,255,255,0.25)"),
                        textShadow: "0 0 15px rgba(0,0,0,0.6)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div
                      style={{
                        width: "140px",
                        flexShrink: 0,
                        marginLeft: "35px",
                      }}
                    >
                      <MovieCard movie={movie} />
                    </div>
                  </div>
                </motion.div>
              ))}            </div>
          </>
        )}
      </div>
    );
  },
  (prev, next) => prev.movies === next.movies && prev.filter === next.filter,
);

const EMPTY_ARRAY = [];

export default function Home({
  filter = "all",
  title = "Trending Across Platforms",
}) {
  const [featuredIndex, setFeaturedIndex] = useState(() =>
    Math.floor(Math.random() * 20),
  );
  const [visibleCatCount, setVisibleCatCount] = useState(4);
  const [activeGenre, setActiveGenre] = useState("All");
  const { continueWatching, myList, isInList, toggleMyList } = useAppAuth();

  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 600], [0, 120]);

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["featuredMovies"],
    queryFn: movieService.getFeaturedMovies,
  });

  const { data: categoriesData, isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => movieService.getCategories("all"),
  });

  const rawCategories = categoriesData || EMPTY_ARRAY;
  const featuredMovies = useMemo(
    () =>
      featuredData
        ? featuredData.map((m) => ({
            ...m,
            source: m.source || "netflix",
            sourceName: m.sourceName || "Netflix",
          }))
        : EMPTY_ARRAY,
    [featuredData],
  );
  const loading = featuredLoading || catsLoading;

  useEffect(() => {
    let inThrottle;
    const handleScroll = () => {
      if (!inThrottle) {
        if (
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 800
        ) {
          setVisibleCatCount((prev) => prev + 3);
        }
        inThrottle = true;
        setTimeout(() => (inThrottle = false), 200);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [isHeroHovered, setIsHeroHovered] = useState(false);

  // Interval logic moved below totalFeatured

  useEffect(() => {
    // Reset visible count when filter changes so we scroll from top again
    setVisibleCatCount(4);
    setActiveGenre("All");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [filter]);

  const categories = useMemo(() => {
    // 1. Collect all unique movies for dynamic rails
    const allUniqueMovies = new Map();
    for (const cat of rawCategories) {
      for (const m of cat.movies) {
        if (!allUniqueMovies.has(m.id)) allUniqueMovies.set(m.id, m);
      }
    }
    let allMovies = Array.from(allUniqueMovies.values());

    // Apply base tab filter to allMovies
    if (filter === "series" || filter === "tv shows")
      allMovies = allMovies.filter((m) => m.isSeries);
    else if (filter === "movies")
      allMovies = allMovies.filter((m) => !m.isSeries);
    else if (filter === "anime")
      allMovies = allMovies.filter(
        (m) =>
          m.genres?.includes("Animation") ||
          (m.tags && m.tags.some((t) => t.toLowerCase().includes("anime"))),
      );

    const getMoviesByLanguage = (lang) => {
      const regex = new RegExp(lang, "i");
      return allMovies
        .filter(
          (m) =>
            (m.audioLanguages &&
              m.audioLanguages.some((l) => l.match(regex))) ||
            (m.languages && m.languages.some((l) => l.match(regex))) ||
            (m.title && m.title.match(regex)),
        )
        .sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
    };

    // 2. Generate dynamic regional rails (Authentic Netflix/Prime pattern)
    let dynamicRegionalRails = [];
    if (activeGenre === "All" && filter !== "new") {
      const malayalam = getMoviesByLanguage("Malayalam");
      const tamil = getMoviesByLanguage("Tamil");
      const hindi = getMoviesByLanguage("Hindi");
      const telugu = getMoviesByLanguage("Telugu");

      const isTV = filter === "series" || filter === "tv shows";

      if (malayalam.length >= 4)
        dynamicRegionalRails.push({
          name: isTV
            ? "Malayalam TV Shows"
            : "Critically Acclaimed Malayalam Movies",
          movies: malayalam,
        });
      if (tamil.length >= 4)
        dynamicRegionalRails.push({
          name: isTV ? "Tamil TV Shows" : "Blockbuster Tamil Movies",
          movies: tamil,
        });
      if (hindi.length >= 4)
        dynamicRegionalRails.push({
          name: isTV ? "Hindi TV Shows" : "Trending in Hindi",
          movies: hindi,
        });
      if (telugu.length >= 4)
        dynamicRegionalRails.push({
          name: isTV ? "Telugu TV Shows" : "Popular Telugu Movies",
          movies: telugu,
        });
    }

    const standardCategories = [];
    for (const cat of rawCategories) {
      let filtered = [...cat.movies];
      let dynamicName = cat.name;

      if (filter === "series" || filter === "tv shows") {
        filtered = filtered.filter((m) => m.isSeries);
        if (
          !dynamicName.toLowerCase().includes("series") &&
          !dynamicName.toLowerCase().includes("tv")
        )
          dynamicName = `${dynamicName} TV Shows`;
      } else if (filter === "movies") {
        filtered = filtered.filter((m) => !m.isSeries);
        if (!dynamicName.toLowerCase().includes("movie"))
          dynamicName = `${dynamicName} Movies`;
      } else if (filter === "anime") {
        filtered = filtered.filter(
          (m) =>
            m.genres?.includes("Animation") ||
            (m.tags && m.tags.some((t) => t.toLowerCase().includes("anime"))),
        );
        if (!dynamicName.toLowerCase().includes("anime"))
          dynamicName = `${dynamicName} Anime`;
      } else if (filter === "new") {
        filtered = filtered
          .sort((a, b) => b.releaseYear - a.releaseYear)
          .slice(0, 30);
      }

      if (activeGenre !== "All") {
        const isRegional = ["Malayalam", "Tamil", "Hindi", "Telugu"].includes(
          activeGenre,
        );
        filtered = filtered.filter((m) => {
          if (isRegional) {
            const regex = new RegExp(activeGenre, "i");
            return (
              (m.audioLanguages &&
                m.audioLanguages.some((l) => l.match(regex))) ||
              (m.languages && m.languages.some((l) => l.match(regex))) ||
              (m.title && m.title.match(regex)) ||
              (m.genres &&
                m.genres.some((g) =>
                  g.toLowerCase().includes(activeGenre.toLowerCase()),
                ))
            );
          }
          return (m.genres || []).some((g) =>
            g.toLowerCase().includes(activeGenre.toLowerCase()),
          );
        });
      }

      if (
        filter === "all" ||
        filter === "series" ||
        filter === "tv shows" ||
        filter === "movies" ||
        filter === "anime"
      ) {
        filtered = filtered.sort(
          (a, b) =>
            (String(a.id).charCodeAt(a.id.length - 1) % 10) -
            (String(b.id).charCodeAt(b.id.length - 1) % 10),
        );
      }

      if (filtered.length > 0) {
        standardCategories.push({ name: dynamicName, movies: filtered });
      }
    }

    // 3. Interleave dynamic regional rails with standard backend rails
    const finalCategories = [];
    let dynamicIdx = 0;

    for (let i = 0; i < standardCategories.length; i++) {
      finalCategories.push(standardCategories[i]);
      // Insert a dynamic regional rail every 2 standard rails to distribute them beautifully
      if ((i + 1) % 2 === 0 && dynamicIdx < dynamicRegionalRails.length) {
        finalCategories.push(dynamicRegionalRails[dynamicIdx]);
        dynamicIdx++;
      }
    }

    // Append any remaining dynamic rails at the end
    while (dynamicIdx < dynamicRegionalRails.length) {
      finalCategories.push(dynamicRegionalRails[dynamicIdx]);
      dynamicIdx++;
    }

    return finalCategories;
  }, [rawCategories, filter, activeGenre]);

  const top10Movies = useMemo(() => {
    const allMovies = [];
    for (const cat of rawCategories) {
      for (const m of cat.movies) {
        if (!allMovies.find((x) => x.id === m.id)) allMovies.push(m);
      }
    }

    // Authentic "Top 10 Today" logic:
    // Real platforms (Netflix) base this on daily trending data.
    // We can simulate this by seeding a shuffle with today's date string,
    // ensuring the Top 10 changes every single day at midnight!
    const todaySeed = new Date().toDateString();

    // Simple string hash for the seed
    let hash = 0;
    for (let i = 0; i < todaySeed.length; i++) {
      hash = (hash << 5) - hash + todaySeed.charCodeAt(i);
      hash |= 0;
    }

    // Deterministic shuffle based on today's hash
    const shuffled = [...allMovies].sort((a, b) => {
      const hashA = (a.id.toString().charCodeAt(0) * hash) % 100;
      const hashB = (b.id.toString().charCodeAt(0) * hash) % 100;
      return hashB - hashA;
    });

    const finalTop10 =
      filter === "series" || filter === "tv shows"
        ? shuffled.filter((m) => m.isSeries)
        : filter === "movies"
          ? shuffled.filter((m) => !m.isSeries)
          : shuffled;

    return finalTop10.slice(0, 10);
  }, [rawCategories, filter]);

  const lastWatched =
    continueWatching && continueWatching.length > 0
      ? continueWatching[0]
      : null;

  const recommendations = useMemo(() => {
    if (!lastWatched) return [];
    const lastWatchedGenres = lastWatched.genres || [];
    if (lastWatchedGenres.length === 0) return [];

    const cwIds = new Set((continueWatching || []).map((m) => m.id));
    const allMovies = [];
    for (const cat of rawCategories) {
      for (const m of cat.movies) {
        if (!cwIds.has(m.id) && !allMovies.find((x) => x.id === m.id)) {
          allMovies.push(m);
        }
      }
    }

    const recs = allMovies.filter((m) =>
      (m.genres || []).some((g) => lastWatchedGenres.includes(g)),
    );
    return recs
      .sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0))
      .slice(0, 15);
  }, [lastWatched, continueWatching, rawCategories]);

  const finalPool = useMemo(() => {
    let globalPool = [];
    let regionalPool = [];
    let recommendedPool = [];

    // 1. Gather Global Featured
    if (featuredMovies.length > 0) {
      featuredMovies.forEach((fm) => {
        if ((filter === "series" || filter === "tv shows") && fm.isSeries)
          globalPool.push(fm);
        else if (filter === "movies" && !fm.isSeries) globalPool.push(fm);
        else if (filter === "anime" && fm.genres?.includes("Animation"))
          globalPool.push(fm);
        else if (filter === "all" || filter === "new" || filter === "mylist")
          globalPool.push(fm);
      });
    }

    // 2. Gather Regional & Recommended from Categories
    if (categories.length > 0) {
      const allCategoryMovies = [];
      categories.forEach((c) => {
        c.movies.forEach((m) => {
          if (m.backdropUrl && !allCategoryMovies.find((p) => p.id === m.id)) {
            allCategoryMovies.push(m);
          }
        });
      });

      // Filter for the current tab (Movies vs Series vs Anime)
      let tabFilteredMovies = allCategoryMovies;
      if (filter === "series" || filter === "tv shows")
        tabFilteredMovies = tabFilteredMovies.filter((m) => m.isSeries);
      if (filter === "movies")
        tabFilteredMovies = tabFilteredMovies.filter((m) => !m.isSeries);
      if (filter === "anime")
        tabFilteredMovies = tabFilteredMovies.filter((m) =>
          m.genres?.includes("Animation"),
        );

      // Extract Regional Content (Tamil, Malayalam, Hindi, Telugu, etc.)
      regionalPool = tabFilteredMovies.filter(
        (m) =>
          m.audioLanguages?.some((l) =>
            l.match(/Tamil|Malayalam|Hindi|Telugu/i),
          ) ||
          m.languages?.some((l) => l.match(/Tamil|Malayalam|Hindi|Telugu/i)) ||
          m.title.match(/Tamil|Malayalam|Hindi|Telugu/i),
      );

      // Extract Recommended Content based on User History
      const lastWatchedGenres = lastWatched?.genres || [];
      recommendedPool = tabFilteredMovies.filter(
        (m) =>
          m.genres?.some((g) => lastWatchedGenres.includes(g)) &&
          m.imdbRating >= 7.5,
      );

      // Fallback for empty regional
      if (regionalPool.length === 0) {
        regionalPool = tabFilteredMovies.filter(
          (m) => m.genres?.includes("Drama") && m.imdbRating >= 8.0,
        );
      }
    }

    // 3. Filter strictly for items with a title image (logoUrl)
    globalPool = globalPool.filter((m) => m.logoUrl);
    regionalPool = regionalPool.filter((m) => m.logoUrl);
    recommendedPool = recommendedPool.filter((m) => m.logoUrl);

    // 4. The "Surpass Authentic" Mixing Algorithm
    const pool = [];
    const usedIds = new Set();

    const pushToPool = (movie) => {
      if (movie && !usedIds.has(movie.id)) {
        pool.push(movie);
        usedIds.add(movie.id);
      }
    };

    let gIdx = 0,
      rIdx = 0,
      recIdx = 0;
    while (
      pool.length < 10 &&
      (gIdx < globalPool.length ||
        rIdx < regionalPool.length ||
        recIdx < recommendedPool.length)
    ) {
      pushToPool(globalPool[gIdx++]);
      pushToPool(regionalPool[rIdx++]);
      pushToPool(recommendedPool[recIdx++]);
    }

    // 5. Always find better: If the active filter yielded no movies with logoUrls,
    // fallback to ANY featured movie that has a logoUrl so the banner doesn't break
    if (pool.length === 0 && featuredMovies.length > 0) {
      for (const fm of featuredMovies) {
        if (fm.logoUrl) {
          pushToPool(fm);
          if (pool.length >= 5) break;
        }
      }
    }

    return pool;
  }, [featuredMovies, categories, filter, lastWatched]);

  const totalFeatured = finalPool.length;
  const activeFeaturedMovie =
    totalFeatured > 0 ? finalPool[featuredIndex % totalFeatured] : null;

  useEffect(() => {
    if (isHeroHovered || totalFeatured <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => prev + 1);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHeroHovered, totalFeatured]);

  // Preload next hero image to eliminate flash on slide change
  useEffect(() => {
    if (totalFeatured <= 1) return;
    const nextMovie = finalPool[(featuredIndex + 1) % totalFeatured];
    if (!nextMovie) return;
    const preloadUrl =
      nextMovie.backdropUrl || nextMovie.posterUrl || nextMovie.poster;
    if (preloadUrl) {
      const img = new window.Image();
      img.src = preloadUrl;
    }
  }, [featuredIndex, totalFeatured, finalPool]);

  return (
    <div className="main-content" style={{ paddingBottom: "2rem" }}>
      <SEO title={title || "Discover Movies & TV Shows"} />
      <AnimatePresence mode="wait">
        {loading && !activeFeaturedMovie ? (
          <motion.div
            key="skeleton-hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="skeleton skeleton-hero"
          />
        ) : activeFeaturedMovie ? (
          <motion.div
            key={activeFeaturedMovie.id}
            className="hero-container"
            initial={{ opacity: 0, filter: "blur(12px)", scale: 1.02 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(8px)", scale: 1.02 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ willChange: "opacity, transform" }}
            onMouseEnter={() => setIsHeroHovered(true)}
            onMouseLeave={() => setIsHeroHovered(false)}
          >
            <motion.img
              src={
                activeFeaturedMovie.backdropUrl ||
                activeFeaturedMovie.posterUrl ||
                activeFeaturedMovie.poster
              }
              alt={activeFeaturedMovie.title}
              className="hero-bg desktop-bg"
              initial={{ scale: 1 }}
              animate={{ scale: 1.03 }}
              transition={{ duration: 8, ease: "linear" }}
              fetchpriority="high"
              loading="eager"
              decoding="async"
              y={heroParallax}
              style={{ willChange: "transform" }}
            />
            <motion.img
              src={
                activeFeaturedMovie.posterUrl ||
                activeFeaturedMovie.poster ||
                activeFeaturedMovie.backdropUrl
              }
              alt={activeFeaturedMovie.title}
              className="hero-bg mobile-bg"
              initial={{ scale: 1 }}
              animate={{ scale: 1.03 }}
              transition={{ duration: 8, ease: "linear" }}
              fetchpriority="high"
              loading="eager"
              decoding="async"
              y={heroParallax}
              style={{ willChange: "transform" }}
            />
            <div className="hero-overlay" />

            {/* Left/Right Navigation Arrows */}
            <AnimatePresence>
              {isHeroHovered && totalFeatured > 1 && (
                <>
                  <motion.button
                    initial={{ opacity: 0, x: -20, y: "-50%" }}
                    animate={{ opacity: 1, x: 0, y: "-50%" }}
                    exit={{ opacity: 0, x: -20, y: "-50%" }}
                    whileHover={{
                      scale: 1.1,
                      backgroundColor: "rgba(0,0,0,0.8)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="hero-nav-arrow left"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFeaturedIndex(
                        (featuredIndex - 1 + totalFeatured) % totalFeatured,
                      );
                    }}
                  >
                    <ChevronLeft size={32} />
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, x: 20, y: "-50%" }}
                    animate={{ opacity: 1, x: 0, y: "-50%" }}
                    exit={{ opacity: 0, x: 20, y: "-50%" }}
                    whileHover={{
                      scale: 1.1,
                      backgroundColor: "rgba(0,0,0,0.8)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="hero-nav-arrow right"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFeaturedIndex((featuredIndex + 1) % totalFeatured);
                    }}
                  >
                    <ChevronRight size={32} />
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            <div className="hero-content">
              <div
                style={{
                  paddingBottom: "1rem",
                  willChange: "transform, opacity",
                }}
              >
                {activeFeaturedMovie.logoUrl ? (
                  <motion.img
                    src={activeFeaturedMovie.logoUrl}
                    alt={activeFeaturedMovie.title}
                    style={{
                      maxHeight: "120px",
                      maxWidth: "100%",
                      marginBottom: "1.5rem",
                      filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))",
                      willChange: "transform",
                    }}
                  />
                ) : (
                  <h1 className="hero-title">{activeFeaturedMovie.title}</h1>
                )}
                <div className="hero-meta">
                  <span>
                    {(
                      activeFeaturedMovie.releaseYear ||
                      activeFeaturedMovie.year
                    )
                      ?.toString()
                      .substring(0, 4)}
                  </span>
                  {activeFeaturedMovie.imdbRating > 0 && (
                    <span style={{ color: "#fbbf24" }}>
                      ⭐ {activeFeaturedMovie.imdbRating}
                    </span>
                  )}
                  <span className="maturity-badge">
                    {activeFeaturedMovie.maturityRating || "TV-MA"}
                  </span>
                  {activeFeaturedMovie.duration &&
                    !activeFeaturedMovie.duration.match(
                      /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
                    ) && <span>{activeFeaturedMovie.duration}</span>}
                  <div style={{ display: "inline-flex", marginLeft: "0.5rem" }}>
                    <PlatformIcon platform={activeFeaturedMovie.source} />
                  </div>
                </div>
                {/* Description — always visible, truncated to 3 lines */}
                {(activeFeaturedMovie.description ||
                  activeFeaturedMovie.longDescription) && (
                  <p
                    className="hero-desc"
                    style={{
                      marginBottom: "1.5rem",
                      marginTop: "0.5rem",
                      cursor: "pointer",
                      lineHeight: 1.5,
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      display: "-webkit-box",
                      overflow: "hidden",
                    }}
                  >
                    {activeFeaturedMovie.description ||
                      activeFeaturedMovie.longDescription ||
                      "Start watching this amazing title right now."}
                  </p>
                )}

                <motion.div
                  style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Link
                    to={`/watch/${activeFeaturedMovie.id}/${slugify(activeFeaturedMovie.title, { lower: true, strict: true })}`}
                  >
                    <motion.button
                      className="btn btn-primary"
                      style={{
                        padding: "0.8rem 2rem",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play size={24} fill="currentColor" stroke="none" />
                      Play
                    </motion.button>
                  </Link>
                  <motion.button
                    className="btn btn-glass"
                    style={{
                      padding: "0.8rem 2rem",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                    whileHover={{
                      scale: 1.03,
                      background: "rgba(255,255,255,0.15)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const wasInList = isInList(activeFeaturedMovie.id);
                      toggleMyList(activeFeaturedMovie);
                    }}
                  >
                    {isInList(activeFeaturedMovie?.id) ? (
                      <Check size={24} />
                    ) : (
                      <Plus size={24} />
                    )}
                    {isInList(activeFeaturedMovie?.id)
                      ? "In My List"
                      : "My List"}
                  </motion.button>
                </motion.div>
              </div>
            </div>

            {/* Navigation Dots — improved with larger touch targets */}
            {totalFeatured > 1 && (
              <div className="hero-dots">
                {Array.from({ length: totalFeatured }).map((_, i) => {
                  const isActive = i === featuredIndex % totalFeatured;
                  return (
                    <motion.button
                      key={i}
                      onClick={() => setFeaturedIndex(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      style={{
                        width: isActive ? "32px" : "8px",
                        height: "6px",
                        borderRadius: "100px",
                        background: isActive
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(255,255,255,0.3)",
                        position: "relative",
                        overflow: "hidden",
                        border: "none",
                        cursor: "pointer",
                        transition:
                          "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        padding: "0",
                        // Invisible padding for larger touch target
                        margin: "10px 2px",
                      }}
                    >
                      {isActive && !isHeroHovered && (
                        <div className="dot-filler" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Genre Filter Chips */}
      {!loading && categories.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
            overflowX: "auto",
            scrollbarWidth: "none",
            padding: "0.4rem 0 0.75rem",
            marginBottom: "0.25rem",
          }}
        >
          {GENRE_OPTIONS.map((genre) => (
            <motion.button
              layout
              key={genre}
              onClick={() => setActiveGenre(genre)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background:
                  activeGenre === genre
                    ? "linear-gradient(135deg, #f43f5e, #fb923c)"
                    : "rgba(255,255,255,0.08)",
                color: activeGenre === genre ? "#fff" : "#fff",
                border:
                  "1px solid " +
                  (activeGenre === genre
                    ? "transparent"
                    : "rgba(255,255,255,0.1)"),
                padding: "6px 16px",
                borderRadius: "100px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s, border-color 0.2s",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {genre}
            </motion.button>
          ))}
        </div>
      )}

      {/* Categories Section */}
      <section
        style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
      >
        <div className="section-header" style={{ marginBottom: 0 }}>
          <h2 className="section-title">{title}</h2>
        </div>

        {loading ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {[1, 2, 3, 4].map((rail) => (
              <div key={rail}>
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton-rail">
                  {[1, 2, 3, 4, 5, 6].map((card) => (
                    <div key={card} className="skeleton skeleton-card"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <h3 style={{ textAlign: "center", color: "#a1a1aa" }}>
            No titles found
          </h3>
        ) : (
          <>
            {/* 1. Top 10 Today — first */}
            {(filter === "all" ||
              filter === "series" ||
              filter === "tv shows" ||
              filter === "movies") &&
              top10Movies.length > 0 &&
              activeGenre === "All" && (
                <FadeInSection>
                  <Top10Rail
                    railIndex={0}
                    movies={top10Movies}
                    filter={filter}
                  />
                </FadeInSection>
              )}
            {/* 2. Continue Watching */}
            {continueWatching &&
              continueWatching.length > 0 &&
              filter === "all" && (
                <FadeInSection>
                  <ErrorBoundary>
                    <MovieRail
                      railIndex={1}
                      category={{
                        name: "Continue Watching",
                        movies: continueWatching,
                      }}
                    />
                  </ErrorBoundary>
                </FadeInSection>
              )}
            {/* 3. Because you watched */}
            {filter === "all" && lastWatched && recommendations.length > 0 && (
              <FadeInSection>
                <ErrorBoundary>
                  <MovieRail
                    railIndex={2}
                    category={{
                      name: `Because you watched ${lastWatched.title}`,
                      movies: recommendations,
                    }}
                  />
                </ErrorBoundary>
              </FadeInSection>
            )}
            {/* 4. My List */}
            {myList && myList.length > 0 && filter === "all" && (
              <FadeInSection>
                <ErrorBoundary>
                  <MovieRail
                    railIndex={3}
                    category={{ name: "My List", movies: myList }}
                  />
                </ErrorBoundary>
              </FadeInSection>
            )}
            {/* 5. Category rails */}
            {categories.slice(0, visibleCatCount).map((category, catIdx) => (
              <FadeInSection key={catIdx} delay={0.1}>
                <ErrorBoundary key={category.id || catIdx}>
                  <MovieRail railIndex={catIdx + 4} category={category} />
                </ErrorBoundary>
              </FadeInSection>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
