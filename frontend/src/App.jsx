import { useState, useEffect, useRef, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Search,
  Home,
  Bookmark,
  Clock,
  User,
  Play,
  X,
  Menu,
  Bell,
  Tv,
  Keyboard,
  LogOut,
  Film,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import slugify from "slugify";
import { movieService } from "./api/movieService";
import { useDebounce } from "./hooks/useDebounce";
import { AnimatePresence, motion } from "framer-motion";
import { useAppAuth } from "./context/AuthContext";
import { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

import Loader from "./components/Loader";
import BackToTop from "./components/BackToTop";
import AuthModal from "./components/AuthModal";
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import { useMediaQuery } from "./hooks/useMediaQuery";

const HomePage = lazy(() => import("./pages/Home"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const PersonDetails = lazy(() => import("./pages/PersonDetails"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const GenrePage = lazy(() => import("./pages/GenrePage"));

function Layout({ children }) {
  useScrollRestoration();
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth > 768 && searchInputRef.current) {
          searchInputRef.current.focus();
        } else {
          navigate("/search");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
  const debouncedQuery = useDebounce(query, 400);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auth state from Firebase
  const {
    user,
    logout,
    searchHistory,
    addSearch,
    removeSearch,
    clearHistory,
    notifications,
    markAllAsRead,
    clearNotifications,
  } = useAppAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const {
    data: rawResults,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => movieService.searchMovies(debouncedQuery),
    enabled: !!debouncedQuery.trim(),
  });

  const results = useMemo(() => {
    if (!rawResults || !rawResults.movies) return [];

    const mapSource = (m) => {
      let source = "netflix";
      let sourceName = "Netflix";
      if (m.availablePlatforms && m.availablePlatforms.length > 0) {
        if (m.availablePlatforms.includes("Prime Video")) {
          source = "prime";
          sourceName = "Prime Video";
        } else if (m.availablePlatforms.includes("Netflix")) {
          source = "netflix";
          sourceName = "Netflix";
        } else if (m.availablePlatforms.includes("Hotstar")) {
          source = "hotstar";
          sourceName = "Hotstar";
        } else if (m.availablePlatforms.includes("Apple TV+")) {
          source = "appletv";
          sourceName = "Apple TV+";
        } else if (m.availablePlatforms.includes("Zee5")) {
          source = "zee5";
          sourceName = "Zee5";
        } else if (m.availablePlatforms.includes("Sony LIV")) {
          source = "sonyliv";
          sourceName = "Sony LIV";
        } else if (m.availablePlatforms.includes("JioCinema")) {
          source = "jio";
          sourceName = "JioCinema";
        }
      }
      return { ...m, source, sourceName };
    };

    const mapped = rawResults.movies.map(mapSource);
    const seen = new Set();
    const unique = mapped.filter((m) => {
      const key = m.tmdbId || m.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.slice(0, 10);
  }, [rawResults]);

  const error = queryError
    ? "Failed to reach server. Please try again later."
    : null;

  useEffect(() => {
    setShowDropdown(false);
    setQuery("");
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
      const clickedOutsideDesktop =
        searchRef.current && !searchRef.current.contains(e.target);
      const clickedOutsideMobile =
        mobileSearchRef.current && !mobileSearchRef.current.contains(e.target);
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setShowDropdown(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowUserMenu(false);
        setShowNotifications(false);
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const isDesktop = useMediaQuery("(min-width: 769px)");

  // Reset selection when results change
  useEffect(() => {
    setSelectedResultIndex(-1);
  }, [results]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      if (selectedResultIndex >= 0 && results[selectedResultIndex]) {
        const r = results[selectedResultIndex];
        addSearch(r.title);
        navigate(
          `/watch/${r.id}/${slugify(r.title, { lower: true, strict: true })}`,
        );
        setQuery("");
        setShowDropdown(false);
        setSelectedResultIndex(-1);
      } else if (query.trim()) {
        addSearch(query);
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        setQuery("");
        setShowDropdown(false);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedResultIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedResultIndex((prev) => Math.max(prev - 1, -1));
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav
        className={`navbar${isScrolled ? ' scrolled' : ''}`}
        style={{
          background: isScrolled
            ? "linear-gradient(180deg, rgba(5,5,5,0.97) 0%, rgba(5,5,5,0.95) 100%)"
            : "linear-gradient(180deg, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.85) 100%)",
          borderBottom: isScrolled
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: isScrolled
            ? "0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)"
            : "none",
        }}
      >
        <div className="nav-left">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <Play
                size={20}
                fill="currentColor"
                stroke="none"
                style={{ marginLeft: "2px" }}
              />
            </div>
            Streamly
            <span style={{ fontSize: '0.5rem', background: 'linear-gradient(135deg, #f43f5e, #fb923c)', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, marginLeft: '6px', letterSpacing: '0.05em', verticalAlign: 'super' }}>v7.0</span>
          </Link>

          <div
            className={`nav-links ${mobileMenuOpen ? "nav-links-open" : ""}`}
          >
            {/* Mobile Search */}
            <div className="mobile-only" style={{ marginBottom: "1rem" }}>
              <div
                ref={mobileSearchRef}
                className="search-wrapper mobile-search"
                style={{ position: "relative" }}
              >
                <Search
                  size={18}
                  className="search-icon"
                  onClick={() => {
                    const input =
                      mobileSearchRef.current?.querySelector("input");
                    if (input) input.focus();
                  }}
                  style={{ cursor: "pointer", padding: "10px" }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="Search movies, shows... (Cmd+K)"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (query) setShowDropdown(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                />
                {query && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setQuery("");
                      setShowDropdown(false);
                    }}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#a1a1aa",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px",
                    }}
                  >
                    <X size={16} aria-label="Close search" />
                  </motion.button>
                )}

                <AnimatePresence>
                  {showDropdown && query && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      style={{
                        position: "absolute",
                        top: "120%",
                        right: 0,
                        width: isDesktop ? "450px" : "100%",
                        background: "rgba(9, 9, 11, 0.85)",
                        backdropFilter: "blur(24px)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "16px",
                        boxShadow:
                          "0 30px 60px -12px rgba(0,0,0,1), 0 0 20px rgba(255,255,255,0.05)",
                        overflow: "hidden",
                        zIndex: 200,
                        maxHeight: "65vh",
                        overflowY: "auto",
                      }}
                    >
                      {loading ? (
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                padding: "0.75rem 1rem",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.05)",
                              }}
                            >
                              <div
                                className="skeleton"
                                style={{
                                  width: "50px",
                                  height: "75px",
                                  borderRadius: "4px",
                                }}
                              ></div>
                              <div
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  className="skeleton"
                                  style={{
                                    width: "60%",
                                    height: "1rem",
                                    borderRadius: "4px",
                                  }}
                                ></div>
                                <div
                                  className="skeleton"
                                  style={{
                                    width: "30%",
                                    height: "0.8rem",
                                    borderRadius: "4px",
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : error ? (
                        <div
                          style={{
                            padding: "3rem",
                            textAlign: "center",
                            color: "#ef4444",
                          }}
                        >
                          {error}
                        </div>
                      ) : results.length > 0 ? (
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          {results.map((r, i) => (
                            <motion.div
                              key={`${r.id}-${i}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05, duration: 0.2 }}
                              onClick={() => {
                                navigate(
                                  `/watch/${r.id}/${slugify(r.title, { lower: true, strict: true })}`,
                                );
                                setQuery("");
                                setShowDropdown(false);
                                setMobileMenuOpen(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                padding: "0.75rem 1rem",
                                cursor: "pointer",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.05)",
                                transition: "background 0.2s",
                                background:
                                  selectedResultIndex === i
                                    ? "rgba(255,255,255,0.1)"
                                    : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(255,255,255,0.05)";
                                setSelectedResultIndex(i);
                              }}
                              onMouseLeave={(e) => {
                                if (selectedResultIndex !== i)
                                  e.currentTarget.style.background =
                                    "transparent";
                              }}
                            >
                              <img
                                loading="lazy"
                                decoding="async"
                                src={r.posterUrl || r.backdropUrl}
                                alt={r.title}
                                style={{
                                  width: "50px",
                                  height: "75px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                  background: "#18181b",
                                }}
                              />
                              <div
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                    color: "#fff",
                                  }}
                                >
                                  {r.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#a1a1aa",
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                  }}
                                >
                                  <span>{r.releaseYear}</span>
                                  <span>•</span>
                                  <span
                                    className={`source-tag source-${r.source}`}
                                    style={{
                                      padding: "0px 6px",
                                      fontSize: "0.6rem",
                                    }}
                                  >
                                    {r.sourceName}
                                  </span>
                                  {r.imdbRating > 0 && (
                                    <span
                                      style={{
                                        color:
                                          r.imdbRating >= 8
                                            ? "#4ade80"
                                            : r.imdbRating >= 6.5
                                              ? "#fbbf24"
                                              : "#f87171",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "2px",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                      }}
                                    >
                                      ⭐ {r.imdbRating}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {/* Keyboard nav hint */}
                          <div
                            style={{
                              padding: "0.5rem 1rem",
                              display: "flex",
                              gap: "1rem",
                              borderTop: "1px solid rgba(255,255,255,0.05)",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: "#52525b",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <kbd
                                style={{
                                  background: "rgba(255,255,255,0.08)",
                                  border: "1px solid rgba(255,255,255,0.12)",
                                  borderRadius: "3px",
                                  padding: "1px 5px",
                                  fontSize: "0.65rem",
                                }}
                              >
                                ↑↓
                              </kbd>{" "}
                              navigate
                            </span>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: "#52525b",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <kbd
                                style={{
                                  background: "rgba(255,255,255,0.08)",
                                  border: "1px solid rgba(255,255,255,0.12)",
                                  borderRadius: "3px",
                                  padding: "1px 5px",
                                  fontSize: "0.65rem",
                                }}
                              >
                                ↵
                              </kbd>{" "}
                              select
                            </span>
                          </div>
                          {/* See all results link */}
                          <div
                            onClick={() => {
                              navigate(
                                `/search?q=${encodeURIComponent(query)}`,
                              );
                              setQuery("");
                              setShowDropdown(false);
                              setMobileMenuOpen(false);
                            }}
                            style={{
                              padding: "0.85rem 1rem",
                              textAlign: "center",
                              color: "#fb923c",
                              fontWeight: 600,
                              fontSize: "0.9rem",
                              cursor: "pointer",
                              borderTop: "1px solid rgba(255,255,255,0.08)",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(255,255,255,0.05)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            See all results for "{query}" →
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "3rem",
                            textAlign: "center",
                            color: "#a1a1aa",
                          }}
                        >
                          No results found for "{query}"
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              to="/"
              className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              to="/series"
              className={`nav-item ${location.pathname.includes("/series") ? "active" : ""}`}
            >
              TV Shows
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              to="/movies"
              className={`nav-item ${location.pathname.includes("/movies") ? "active" : ""}`}
            >
              Movies
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              to="/new"
              className={`nav-item ${location.pathname.includes("/new") ? "active" : ""}`}
            >
              New & Popular
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              to="/anime"
              className={`nav-item ${location.pathname.includes("/anime") ? "active" : ""}`}
            >
              Anime
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              to="/mylist"
              className={`nav-item ${location.pathname === "/mylist" ? "active" : ""}`}
            >
              My List
            </Link>
          </div>
        </div>

        <div className="nav-right">
          <div
            ref={searchRef}
            className="search-wrapper desktop-only"
            style={{ position: "relative" }}
          >
            <Search
              size={18}
              className="search-icon"
              onClick={() => {
                const input = searchRef.current?.querySelector("input");
                if (input) input.focus();
              }}
              style={{ cursor: "pointer", padding: "10px" }}
            />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search movies, shows... (Cmd+K)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleSearchKeyDown}
            />
            {query && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setQuery("");
                  setShowDropdown(false);
                }}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#a1a1aa",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px",
                }}
              >
                <X size={16} aria-label="Close search" />
              </motion.button>
            )}

            <AnimatePresence>
              {showDropdown &&
                (query || (searchHistory && searchHistory.length > 0)) && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{
                      position: "absolute",
                      top: "120%",
                      right: 0,
                      width: isDesktop ? "450px" : "100%",
                      background: "rgba(9, 9, 11, 0.85)",
                      backdropFilter: "blur(24px)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "16px",
                      boxShadow:
                        "0 30px 60px -12px rgba(0,0,0,1), 0 0 20px rgba(255,255,255,0.05)",
                      overflow: "hidden",
                      zIndex: 200,
                      maxHeight: "65vh",
                      overflowY: "auto",
                    }}
                  >
                    {!query && searchHistory && searchHistory.length > 0 ? (
                      <div style={{ padding: "0.75rem" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                            padding: "0 0.25rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: "#71717a",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            Recent Searches
                          </span>
                          <button
                            onClick={() => clearHistory()}
                            style={{
                              fontSize: "0.75rem",
                              color: "#71717a",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "#fff")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "#71717a")
                            }
                          >
                            Clear all
                          </button>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                          }}
                        >
                          {searchHistory.slice(0, 8).map((term) => (
                            <motion.button
                              key={term}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                setQuery(term);
                                addSearch(term);
                                navigate(
                                  `/search?q=${encodeURIComponent(term)}`,
                                );
                                setShowDropdown(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "100px",
                                padding: "5px 12px",
                                fontSize: "0.82rem",
                                color: "#e4e4e7",
                                cursor: "pointer",
                                fontWeight: 500,
                              }}
                            >
                              <span>{term}</span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSearch(term);
                                }}
                                style={{
                                  color: "#71717a",
                                  marginLeft: "2px",
                                  fontSize: "0.75rem",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.color = "#f87171")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color = "#71717a")
                                }
                              >
                                ×
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ) : loading ? (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              padding: "0.75rem 1rem",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <div
                              className="skeleton"
                              style={{
                                width: "50px",
                                height: "75px",
                                borderRadius: "4px",
                              }}
                            ></div>
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              <div
                                className="skeleton"
                                style={{
                                  width: "60%",
                                  height: "1rem",
                                  borderRadius: "4px",
                                }}
                              ></div>
                              <div
                                className="skeleton"
                                style={{
                                  width: "30%",
                                  height: "0.8rem",
                                  borderRadius: "4px",
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : error ? (
                      <div
                        style={{
                          padding: "3rem",
                          textAlign: "center",
                          color: "#ef4444",
                        }}
                      >
                        {error}
                      </div>
                    ) : results.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {results.map((r, i) => (
                          <motion.div
                            key={`${r.id}-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                            onClick={() => {
                              navigate(
                                `/watch/${r.id}/${slugify(r.title, { lower: true, strict: true })}`,
                              );
                              setQuery("");
                              setShowDropdown(false);
                              setMobileMenuOpen(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              padding: "0.75rem 1rem",
                              cursor: "pointer",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                              transition: "background 0.2s",
                              background:
                                selectedResultIndex === i
                                  ? "rgba(255,255,255,0.1)"
                                  : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(255,255,255,0.05)";
                              setSelectedResultIndex(i);
                            }}
                            onMouseLeave={(e) => {
                              if (selectedResultIndex !== i)
                                e.currentTarget.style.background =
                                  "transparent";
                            }}
                          >
                            <img
                              loading="lazy"
                              decoding="async"
                              src={r.posterUrl || r.backdropUrl}
                              alt={r.title}
                              style={{
                                width: "50px",
                                height: "75px",
                                objectFit: "cover",
                                borderRadius: "4px",
                                background: "#18181b",
                              }}
                            />
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: "0.95rem",
                                  color: "#fff",
                                }}
                              >
                                {r.title}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#a1a1aa",
                                  display: "flex",
                                  gap: "8px",
                                  alignItems: "center",
                                }}
                              >
                                <span>{r.releaseYear}</span>
                                <span>•</span>
                                <span
                                  className={`source-tag source-${r.source}`}
                                  style={{
                                    padding: "0px 6px",
                                    fontSize: "0.6rem",
                                  }}
                                >
                                  {r.sourceName}
                                </span>
                                {r.imdbRating > 0 && (
                                  <span
                                    style={{
                                      color:
                                        r.imdbRating >= 8
                                          ? "#4ade80"
                                          : r.imdbRating >= 6.5
                                            ? "#fbbf24"
                                            : "#f87171",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "2px",
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                    }}
                                  >
                                    ⭐ {r.imdbRating}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {/* Keyboard nav hint */}
                        <div
                          style={{
                            padding: "0.5rem 1rem",
                            display: "flex",
                            gap: "1rem",
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "#52525b",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <kbd
                              style={{
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: "3px",
                                padding: "1px 5px",
                                fontSize: "0.65rem",
                              }}
                            >
                              ↑↓
                            </kbd>{" "}
                            navigate
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "#52525b",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <kbd
                              style={{
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: "3px",
                                padding: "1px 5px",
                                fontSize: "0.65rem",
                              }}
                            >
                              ↵
                            </kbd>{" "}
                            select
                          </span>
                        </div>
                        {/* See all results link */}
                        <div
                          onClick={() => {
                            addSearch(query);
                            navigate(`/search?q=${encodeURIComponent(query)}`);
                            setQuery("");
                            setShowDropdown(false);
                            setMobileMenuOpen(false);
                          }}
                          style={{
                            padding: "0.85rem 1rem",
                            textAlign: "center",
                            color: "#fb923c",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255,255,255,0.05)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          See all results for "{query}" →
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "3rem",
                          textAlign: "center",
                          color: "#a1a1aa",
                        }}
                      >
                        No results found for "{query}"
                      </div>
                    )}
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* Notifications Dropdown */}
          <div
            ref={notificationsRef}
            style={{
              position: "relative",
              marginRight: "1rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              className="user-avatar"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (
                  !showNotifications &&
                  notifications.some((n) => !n.isRead)
                ) {
                  markAllAsRead();
                }
              }}
              style={{
                background: "transparent",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <Bell size={20} aria-label="Notifications" color="#e4e4e7" />
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "4px",
                    width: "16px",
                    height: "16px",
                    background: "#ef4444",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    color: "#fff",
                  }}
                >
                  {notifications.filter((n) => !n.isRead).length}
                </div>
              )}
            </div>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{
                    position: "absolute",
                    top: "120%",
                    right: -10,
                    background: "rgba(9, 9, 11, 0.85)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "16px",
                    boxShadow:
                      "0 30px 60px -12px rgba(0,0,0,1), 0 0 20px rgba(255,255,255,0.05)",
                    padding: "8px 0",
                    width: "320px",
                    zIndex: 200,
                    maxHeight: "70vh",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        color: "#fff",
                      }}
                    >
                      Notifications
                    </div>
                    {notifications.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={clearNotifications}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#a1a1aa",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        Clear All
                      </motion.button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div
                      style={{
                        padding: "2rem 1rem",
                        textAlign: "center",
                        color: "#a1a1aa",
                        fontSize: "0.85rem",
                      }}
                    >
                      You're all caught up!
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const diffMs = Date.now() - (n.createdAt || Date.now());
                      const diffDays = Math.floor(
                        diffMs / (1000 * 60 * 60 * 24),
                      );
                      let timeStr = "Just now";
                      if (diffDays === 1) timeStr = "Yesterday";
                      else if (diffDays > 1) timeStr = `${diffDays} days ago`;
                      else if (diffMs > 1000 * 60 * 60)
                        timeStr = `${Math.floor(diffMs / (1000 * 60 * 60))}h ago`;
                      else if (diffMs > 1000 * 60)
                        timeStr = `${Math.floor(diffMs / (1000 * 60))}m ago`;

                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            if (n.link) navigate(n.link);
                          }}
                          style={{
                            padding: "12px 16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            cursor: n.link ? "pointer" : "default",
                          }}
                          onMouseEnter={(e) => {
                            if (n.link)
                              e.currentTarget.style.background =
                                "rgba(255,255,255,0.05)";
                          }}
                          onMouseLeave={(e) => {
                            if (n.link)
                              e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "#fff",
                              fontWeight: 500,
                            }}
                          >
                            {n.title}
                          </div>
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "#a1a1aa",
                              lineHeight: 1.4,
                            }}
                          >
                            {n.message}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#71717a",
                              marginTop: "4px",
                            }}
                          >
                            {timeStr}
                          </div>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar with Dropdown */}
          <div ref={userMenuRef} style={{ position: "relative" }}>
            <div
              className="user-avatar"
              onClick={() =>
                user ? setShowUserMenu(!showUserMenu) : setShowAuthModal(true)
              }
              title={user ? user.displayName || user.email : "Sign In"}
              style={{ cursor: "pointer", position: "relative" }}
            >
              {user ? (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #f97316, #fb923c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {(user.displayName || user.email || "?")[0].toUpperCase()}
                </div>
              ) : (
                <User size={20} aria-label="Sign In" />
              )}
            </div>
            <AnimatePresence>
              {showUserMenu && user && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{
                    position: "absolute",
                    top: "120%",
                    right: 0,
                    background: "rgba(9, 9, 11, 0.85)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "16px",
                    boxShadow:
                      "0 30px 60px -12px rgba(0,0,0,1), 0 0 20px rgba(255,255,255,0.05)",
                    padding: "8px 0",
                    minWidth: "200px",
                    zIndex: 200,
                  }}
                >
                  {/* Signed-in user info */}
                  <div
                    style={{
                      padding: "10px 16px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        color: "#fff",
                      }}
                    >
                      {user.displayName || "Streamer"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#71717a",
                        marginTop: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.email}
                    </div>
                  </div>

                  <Link
                    to="/mylist"
                    onClick={() => setShowUserMenu(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      fontSize: "0.9rem",
                      color: "#e4e4e7",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Bookmark size={16} /> My List
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setShowUserMenu(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      fontSize: "0.9rem",
                      color: "#e4e4e7",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Clock size={16} /> Watch History
                  </Link>
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.08)",
                      margin: "4px 0",
                    }}
                  />
                  <div
                    onClick={() => {
                      setShowUserMenu(false);
                      window.dispatchEvent(
                        new KeyboardEvent("keydown", {
                          key: "?",
                          shiftKey: true,
                        }),
                      );
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      fontSize: "0.9rem",
                      color: "#e4e4e7",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Keyboard size={16} /> Keyboard Shortcuts
                  </div>
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.08)",
                      margin: "4px 0",
                    }}
                  />
                  {/* Sign Out */}
                  <div
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      fontSize: "0.9rem",
                      color: "#f87171",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(239,68,68,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <LogOut size={16} /> Sign Out
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Auth Modal */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />

          {/* Hamburger button for mobile */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "10px",
              marginLeft: "0.5rem",
            }}
          >
            {mobileMenuOpen ? (
              <X size={24} aria-label="Close menu" />
            ) : (
              <Menu size={24} aria-label="Open menu" />
            )}
          </motion.button>
        </div>
      </nav>

      {/* Main Content Area with Page Transitions */}
      <main className="main-content">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ flex: 1 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Back to top */}
      <BackToTop />

      {/* Mobile Bottom Navigation Bar (Surpassing authentic platforms with persistent UX) */}

      <div className="mobile-bottom-nav">
        <Link
          to="/"
          className={`bottom-nav-item ${location.pathname === "/" ? "active" : ""}`}
        >
          <Home size={22} />
          <span>Home</span>
        </Link>
        <Link
          to="/movies"
          className={`bottom-nav-item ${location.pathname === "/movies" ? "active" : ""}`}
        >
          <Film size={22} />
          <span>Movies</span>
        </Link>
        <Link
          to="/series"
          className={`bottom-nav-item ${location.pathname === "/series" ? "active" : ""}`}
        >
          <Tv size={22} />
          <span>TV Shows</span>
        </Link>
        <Link
          to="/search"
          className={`bottom-nav-item ${location.pathname === "/search" ? "active" : ""}`}
        >
          <Search size={22} />
          <span>Search</span>
        </Link>
        <Link
          to="/mylist"
          className={`bottom-nav-item ${location.pathname === "/mylist" ? "active" : ""}`}
        >
          <Bookmark size={22} />
          <span>My List</span>
        </Link>
      </div>
    </div>
  );
}

import { ServerWakeupNotification } from "./ServerWakeupNotification";
import GlobalShortcuts from "./components/GlobalShortcuts";

function App() {
  return (
    <Router>
      <ServerWakeupNotification />
      <Loader variant="global" />
      <GlobalShortcuts />
      <Layout>
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage filter="all" title="Trending Across Platforms" />
                }
              />
              <Route
                path="/series"
                element={<HomePage filter="series" title="Top TV Shows" />}
              />
              <Route
                path="/movies"
                element={
                  <HomePage filter="movies" title="Blockbuster Movies" />
                }
              />
              <Route
                path="/new"
                element={
                  <HomePage filter="new" title="New & Popular Arrivals" />
                }
              />
              <Route
                path="/anime"
                element={<HomePage filter="anime" title="Anime Collection" />}
              />
              <Route path="/mylist" element={<WatchlistPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/category/:name" element={<CategoryPage />} />
              <Route path="/genre/:genre" element={<GenrePage />} />
              <Route path="/watch/:id/:slug?" element={<MovieDetails />} />
              <Route path="/person/:id/:slug?" element={<PersonDetails />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </Router>
  );
}

export default App;
