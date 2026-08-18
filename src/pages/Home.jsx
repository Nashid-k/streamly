import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyList, useContinueWatching } from '../hooks/useUserData';
const decodeUrl = (encodedStr) => {
  if (!encodedStr || encodedStr.startsWith('http')) return encodedStr;
  try {
    const secret = 'STREAMLY_SECURE';
    const decodedB64 = atob(encodedStr);
    return decodedB64.split('').map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length))).join('');
  } catch(e) {
    return encodedStr;
  }
};

const MovieRail = ({ category }) => {
  const railRef = useRef(null);

  const scrollRail = (dir) => {
    if (railRef.current) {
      railRef.current.scrollBy({ left: dir === 'left' ? -600 : 600, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, paddingLeft: '4px' }}>{category.name}</h3>
      <div style={{ position: 'relative' }} className="movie-rail-wrapper">
        <button 
          onClick={() => scrollRail('left')} 
          style={{ position: 'absolute', left: '-20px', top: '40%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(24, 24, 27, 1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(24, 24, 27, 0.8)'}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div ref={railRef} style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', padding: '0.5rem 4px 1.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="movie-rail">
          {category.movies.map((movie, idx) => {
            // Derive platform source — handle old localStorage items that may lack 'source'
            const movieSource = movie.source || (movie.availablePlatforms?.includes('Prime Video') ? 'nprime' : movie.availablePlatforms?.includes('Hotstar') ? 'hotstar' : 'nflix');
            return (
              <motion.div key={`${movie.id}-${movieSource || idx}`} style={{ width: '220px', flexShrink: 0 }}>
                <Link to={`/movie/${movieSource}/${movie.id}`}>
                  <div className="movie-card">
                    <div className="poster-wrapper">
                      <img src={movie.posterUrl || movie.poster} alt={movie.title} className="movie-poster" />
                      <div className="card-overlay">
                        <div className="play-circle">
                          <Play size={24} fill="currentColor" stroke="none" style={{ marginLeft: '4px' }} />
                        </div>
                      </div>
                    </div>
                    <div className="movie-info">
                      <h3 className="movie-title">{movie.title}</h3>
                      <div className="movie-meta">
                        <span>{movie.releaseYear || movie.year}</span>
                        {movie.imdbRating > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#fbbf24', fontWeight: 600 }}>
                            ⭐ {movie.imdbRating}
                          </span>
                        )}
                        <span className={`source-tag source-${movieSource}`}>
                          {movie.sourceName}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <button 
          onClick={() => scrollRail('right')} 
          style={{ position: 'absolute', right: '-20px', top: '40%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(24, 24, 27, 1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(24, 24, 27, 0.8)'}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

const MOCK_MOVIES = [
  { id: 1, title: "Inception", releaseYear: 2010, source: "nflix", sourceName: "Netflix", posterUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg" },
  { id: 2, title: "The Boys", releaseYear: 2019, source: "nprime", sourceName: "Prime Video", posterUrl: "https://image.tmdb.org/t/p/w500/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg" },
  { id: 3, title: "Loki", releaseYear: 2021, source: "hotstar", sourceName: "Hotstar", posterUrl: "https://image.tmdb.org/t/p/w500/kEl2t3OhXc3Zb9FBh1AuYzRTgZp.jpg" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

let CACHED_RAW_CATEGORIES = null;
let CACHED_FEATURED = null;
let FETCH_PROMISE = null;

export default function Home({ filter = 'all', title = 'Trending Across Platforms' }) {
  const [rawCategories, setRawCategories] = useState(CACHED_RAW_CATEGORIES || []);
  const [loading, setLoading] = useState(!CACHED_RAW_CATEGORIES);
  const [showDesc, setShowDesc] = useState(false);
  const [descTimeout, setDescTimeout] = useState(null);
  const [featuredMovies, setFeaturedMovies] = useState(CACHED_FEATURED || []);
  const [featuredIndex, setFeaturedIndex] = useState(() => Math.floor(Math.random() * 20));
  const [visibleCatCount, setVisibleCatCount] = useState(2);
  const { continueWatching } = useContinueWatching();
  const { myList } = useMyList();

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
        setVisibleCatCount(prev => prev + 2);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFeaturedIndex(prev => prev + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Reset visible count when filter changes so we scroll from top again
    setVisibleCatCount(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filter]);

  useEffect(() => {
    if (CACHED_RAW_CATEGORIES) {
      setRawCategories(CACHED_RAW_CATEGORIES);
      setFeaturedMovies(CACHED_FEATURED);
      setLoading(false);
      return;
    }

    if (!FETCH_PROMISE) {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const featuredPromise = fetch(`${API_URL}/movies/featured?platform=nflix`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map(m => ({ ...m, source: 'nflix', sourceName: 'Netflix' }));
            CACHED_FEATURED = mapped;
            setFeaturedMovies(mapped);
          }
        })
        .catch(() => {});

      const catsPromise = Promise.all([
        fetch(`${API_URL}/movies/categories?platform=nflix`).then(res => res.json()).catch(() => []),
        fetch(`${API_URL}/movies/categories?platform=nprime`).then(res => res.json()).catch(() => []),
        fetch(`${API_URL}/movies/categories?platform=hotstar`).then(res => res.json()).catch(() => [])
      ]).then(([nflixData, nprimeData, hotstarData]) => {
        const catMap = new Map();
        
        const processData = (data, source, sourceName) => {
          if (!Array.isArray(data)) return;
          data.forEach(cat => {
            if (!catMap.has(cat.name)) catMap.set(cat.name, []);
            catMap.get(cat.name).push(...cat.movies.map(m => ({ ...m, source, sourceName })));
          });
        };

        processData(nflixData, 'nflix', 'Netflix');
        processData(nprimeData, 'nprime', 'Prime Video');
        processData(hotstarData, 'hotstar', 'Hotstar');

        const aggregated = [];
        for (const [name, allMovies] of catMap.entries()) {
          const uniqueMoviesMap = new Map();
          for (const m of allMovies) {
            if (!uniqueMoviesMap.has(m.id)) uniqueMoviesMap.set(m.id, m);
          }
          aggregated.push({ name, movies: Array.from(uniqueMoviesMap.values()) });
        }
        CACHED_RAW_CATEGORIES = aggregated;
        setRawCategories(aggregated);
      }).catch(() => {});

      FETCH_PROMISE = Promise.all([featuredPromise, catsPromise]).finally(() => {
        setLoading(false);
        FETCH_PROMISE = null;
      });
    } else {
      FETCH_PROMISE.then(() => {
        setRawCategories(CACHED_RAW_CATEGORIES || []);
        setFeaturedMovies(CACHED_FEATURED || null);
        setLoading(false);
      });
    }
  }, []);

  const categories = useMemo(() => {
    const finalCategories = [];
    for (const cat of rawCategories) {
      let filtered = [...cat.movies];
      
      if (filter === 'series') filtered = filtered.filter(m => m.isSeries);
      else if (filter === 'movies') filtered = filtered.filter(m => !m.isSeries);
      else if (filter === 'new') filtered = filtered.sort((a, b) => b.releaseYear - a.releaseYear).slice(0, 30);
      
      if (filter === 'all' || filter === 'series' || filter === 'movies') {
          // deterministic pseudo-random sort using id to prevent blinking across renders
          filtered = filtered.sort((a, b) => (a.id * 13 % 10) - (b.id * 13 % 10));
      }

      if (filtered.length > 0) {
        finalCategories.push({ name: cat.name, movies: filtered });
      }
    }
    return finalCategories;
  }, [rawCategories, filter]);

  const activeFeaturedMovie = useMemo(() => {
    let pool = [];
    if (featuredMovies.length > 0) {
      featuredMovies.forEach(fm => {
        if (filter === 'series' && fm.isSeries) pool.push(fm);
        else if (filter === 'movies' && !fm.isSeries) pool.push(fm);
        else if (filter === 'all' || filter === 'new' || filter === 'mylist') pool.push(fm);
      });
    }
    if (categories.length > 0) {
      categories.forEach(c => {
        c.movies.forEach(m => {
          if (m.backdropUrl && !pool.find(p => p.id === m.id)) pool.push(m);
        });
      });
    }
    
    // Prioritize movies with title logos for a premium banner experience
    const premiumPool = pool.filter(m => m.logoUrl);
    const poolToUse = premiumPool.length >= 3 ? premiumPool : pool;
    
    // Limit to top 10 to keep the banner high-quality and relevant
    const finalPool = poolToUse.slice(0, 10);
    if (finalPool.length === 0) return null;
    return finalPool[featuredIndex % finalPool.length];
  }, [featuredMovies, categories, featuredIndex, filter]);

  const handleMouseEnterDesc = () => {
    if (descTimeout) clearTimeout(descTimeout);
    setShowDesc(true);
  };
  
  const handleMouseLeaveDesc = () => {
    const t = setTimeout(() => setShowDesc(false), 5000);
    setDescTimeout(t);
  };

  return (
    <div className="main-content" style={{ paddingBottom: '2rem' }}>
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
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ willChange: 'opacity, transform' }}
          >
            <div 
              className="hero-bg" 
              style={{ 
                backgroundImage: `url(${activeFeaturedMovie.backdropUrl || activeFeaturedMovie.posterUrl || activeFeaturedMovie.poster})`,
                willChange: 'transform'
              }} 
            />
            <div className="hero-overlay" />
            
            <div className="hero-content">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                onMouseEnter={handleMouseEnterDesc}
                onMouseLeave={handleMouseLeaveDesc}
                style={{ paddingBottom: '1rem', willChange: 'transform, opacity' }}
              >
                {activeFeaturedMovie.logoUrl ? (
                  <img 
                    src={activeFeaturedMovie.logoUrl} 
                    alt={activeFeaturedMovie.title} 
                    style={{ maxHeight: '120px', maxWidth: '100%', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))', willChange: 'transform' }} 
                  />
                ) : (
                  <h1 className="hero-title">{activeFeaturedMovie.title}</h1>
                )}
                <div className="hero-meta">
                  <span>{activeFeaturedMovie.releaseYear || activeFeaturedMovie.year}</span>
                  {activeFeaturedMovie.imdbRating > 0 && (
                    <span style={{ color: '#fbbf24' }}>⭐ {activeFeaturedMovie.imdbRating}</span>
                  )}
                  <span>{activeFeaturedMovie.maturityRating || 'TV-MA'}</span>
                  <span>{activeFeaturedMovie.duration}</span>
                  <span className={`source-tag source-${activeFeaturedMovie.source}`}>
                    {activeFeaturedMovie.sourceName}
                  </span>
                </div>
              <AnimatePresence>
                {showDesc && (
                  <motion.p 
                    className="hero-desc"
                    initial={{ height: 0, opacity: 0, margin: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginBottom: '2rem' }}
                    exit={{ height: 0, opacity: 0, margin: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    {activeFeaturedMovie.description || "Start watching this amazing title right now."}
                  </motion.p>
                )}
              </AnimatePresence>
              <motion.div 
                style={{ display: 'flex', gap: '1rem' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Link to={`/movie/${activeFeaturedMovie.source}/${activeFeaturedMovie.id}`}>
                  <button className="btn btn-primary">
                    <Play size={20} fill="currentColor" stroke="none" />
                    Play
                  </button>
                </Link>
                <Link to={`/movie/${activeFeaturedMovie.source}/${activeFeaturedMovie.id}`}>
                  <button className="btn btn-glass">
                    <Info size={20} />
                    More Info
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
      </AnimatePresence>

      {/* Categories Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <h2 className="section-title">{title}</h2>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {[1, 2].map((rail) => (
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
           <h3 style={{ textAlign: 'center', color: '#a1a1aa' }}>No titles found</h3>
        ) : (
          <>
            {continueWatching && continueWatching.length > 0 && filter === 'all' && (
              <MovieRail category={{ name: 'Continue Watching', movies: continueWatching }} />
            )}
            {myList && myList.length > 0 && filter === 'all' && (
              <MovieRail category={{ name: 'My List', movies: myList }} />
            )}
            {categories.slice(0, visibleCatCount).map((category, catIdx) => (
              <MovieRail key={catIdx} category={category} />
            ))}
          </>
        )}
      </section>
      <style dangerouslySetInnerHTML={{__html: `
        .movie-rail::-webkit-scrollbar {
          height: 8px;
        }
        .movie-rail::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .movie-rail::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .movie-rail::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}} />
    </div>
  );
}
