import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyList, useContinueWatching } from '../hooks/useUserData';
const cache = {
  rawCategories: null,
  featured: null,
  fetchPromise: null
};

const GENRE_OPTIONS = ['All', 'Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 'Romance', 'Animation', 'Crime', 'Mystery', 'Adventure', 'Fantasy'];

function MovieRail({ category }) {
  const railRef = useRef(null);
  const containerRef = useRef(null);
  const [showArrows, setShowArrows] = useState(false);
  const [inView, setInView] = useState(false);
  const isContinueWatching = category.name === 'Continue Watching';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const scroll = (dir) => {
    if (railRef.current) {
      railRef.current.scrollBy({ left: dir === 'left' ? -600 : 600, behavior: 'smooth' });
    }
  };

  if (!category?.movies || category.movies.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="movie-rail-wrapper"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
      style={{ position: 'relative', minHeight: '280px' }}
    >
      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>{category.name}</h3>

      {inView && (
        <>
          <AnimatePresence>
            {showArrows && (
              <>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => scroll('left')}
                  style={{ position: 'absolute', left: '-10px', top: '55%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                >
                  <ChevronLeft size={22} />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => scroll('right')}
                  style={{ position: 'absolute', right: '-10px', top: '55%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                >
                  <ChevronRight size={22} />
                </motion.button>
              </>
            )}
          </AnimatePresence>

          <div
            ref={railRef}
            className="movie-rail"
            style={{ display: 'flex', gap: '1rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.5rem' }}
          >
            {category.movies.map((movie, i) => (
          <Link to={`/movie/${movie.source || 'nflix'}/${movie.id}`} key={`${movie.id}-${i}`} style={{ flexShrink: 0 }}>
            <div className="movie-card" style={{ width: '200px', flexShrink: 0 }}>
              <div className="poster-wrapper">
                <img src={movie.posterUrl || movie.backdropUrl} alt={movie.title} className="movie-poster" loading="lazy" decoding="async" />
                <div className="card-overlay">
                  <div className="play-circle"><Play size={24} fill="currentColor" stroke="none" style={{ marginLeft: '4px' }} /></div>
                </div>
                {isContinueWatching && movie.isSeries && movie.savedSeason && (
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.85)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
                    S{movie.savedSeason} E{movie.savedEpisode || 1}
                  </div>
                )}
                {isContinueWatching && !movie.isSeries && (
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.85)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
                    Movie
                  </div>
                )}
              </div>
              <div className="movie-info">
                <h3 className="movie-title">{movie.title}</h3>
                <div className="movie-meta">
                  <span>{movie.releaseYear || movie.year}</span>
                  {movie.imdbRating > 0 && <span style={{ color: '#fbbf24' }}>⭐ {movie.imdbRating}</span>}
                  <span className={`source-tag source-${movie.source}`}>{movie.sourceName}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
        </>
      )}
    </div>
  );
}

function Top10Rail({ movies }) {
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
      { rootMargin: '300px 0px' }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const scroll = (dir) => {
    if (railRef.current) {
      railRef.current.scrollBy({ left: dir === 'left' ? -600 : 600, behavior: 'smooth' });
    }
  };

  if (top10.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="movie-rail-wrapper"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
      style={{ position: 'relative', minHeight: '330px' }}
    >
      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>🔥 Top 10 Today</h3>
      
      {inView && (
        <>
          <AnimatePresence>
        {showArrows && (
          <>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              style={{ position: 'absolute', left: '-10px', top: '55%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
            >
              <ChevronLeft size={22} />
            </motion.button>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => scroll('right')}
              style={{ position: 'absolute', right: '-10px', top: '55%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
            >
              <ChevronRight size={22} />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      <div
        ref={railRef}
        className="movie-rail"
        style={{ display: 'flex', gap: '2rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.5rem', paddingLeft: '1rem' }}
      >
        {top10.map((movie, i) => (
          <Link to={`/movie/${movie.source || 'nflix'}/${movie.id}`} key={`top10-${movie.id}`} style={{ flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', width: '210px', flexShrink: 0 }}>
              <span style={{
                position: 'absolute', bottom: '-10px', left: '-25px', fontSize: '8rem', fontWeight: 900,
                color: 'transparent', WebkitTextStroke: '3px rgba(255,255,255,0.6)',
                lineHeight: 1, zIndex: 2, pointerEvents: 'none', userSelect: 'none',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)'
              }}>
                {i + 1}
              </span>
              <div className="movie-card" style={{ width: '160px', flexShrink: 0, marginLeft: '40px' }}>
                <div className="poster-wrapper">
                  <img src={movie.posterUrl || movie.backdropUrl} alt={movie.title} className="movie-poster" loading="lazy" decoding="async" />
                  <div className="card-overlay">
                    <div className="play-circle"><Play size={24} fill="currentColor" stroke="none" style={{ marginLeft: '4px' }} /></div>
                  </div>
                </div>
                <div className="movie-info">
                  <h3 className="movie-title">{movie.title}</h3>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
        </>
      )}
    </div>
  );
}

export default function Home({ filter = 'all', title = 'Trending Across Platforms' }) {
  const [rawCategories, setRawCategories] = useState(cache.rawCategories || []);
  const [loading, setLoading] = useState(!cache.rawCategories);
  const [showDesc, setShowDesc] = useState(false);
  const [descTimeout, setDescTimeout] = useState(null);
  const [featuredMovies, setFeaturedMovies] = useState(cache.featured || []);
  const [featuredIndex, setFeaturedIndex] = useState(() => Math.floor(Math.random() * 20));
  const [visibleCatCount, setVisibleCatCount] = useState(4);
  const [activeGenre, setActiveGenre] = useState('All');
  const { continueWatching } = useContinueWatching();
  const { myList } = useMyList();

  useEffect(() => {
    let inThrottle;
    const handleScroll = () => {
      if (!inThrottle) {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
          setVisibleCatCount(prev => prev + 3);
        }
        inThrottle = true;
        setTimeout(() => inThrottle = false, 200);
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
    setVisibleCatCount(4);
    setActiveGenre('All');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [filter]);

  useEffect(() => {
    if (cache.rawCategories) {
      setRawCategories(cache.rawCategories);
      setFeaturedMovies(cache.featured);
      setLoading(false);
      return;
    }

    if (!cache.fetchPromise) {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const featuredPromise = fetch(`${API_URL}/movies/featured?platform=nflix`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map(m => ({ ...m, source: 'nflix', sourceName: 'Netflix' }));
            cache.featured = mapped;
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
        cache.rawCategories = aggregated;
        setRawCategories(aggregated);
      }).catch(() => {});

      cache.fetchPromise = Promise.all([featuredPromise, catsPromise]).finally(() => {
        setLoading(false);
        cache.fetchPromise = null;
      });
    } else {
      cache.fetchPromise.then(() => {
        setRawCategories(cache.rawCategories || []);
        setFeaturedMovies(cache.featured || null);
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
      else if (filter === 'anime') {
        if (!cat.name.toLowerCase().includes('anime')) continue;
      }
      else if (filter === 'new') filtered = filtered.sort((a, b) => b.releaseYear - a.releaseYear).slice(0, 30);
      
      if (activeGenre !== 'All') {
        filtered = filtered.filter(m => (m.genres || []).some(g => g.toLowerCase().includes(activeGenre.toLowerCase())));
      }

      if (filter === 'all' || filter === 'series' || filter === 'movies' || filter === 'anime') {
          // deterministic pseudo-random sort using id to prevent blinking across renders
          filtered = filtered.sort((a, b) => (a.id * 13 % 10) - (b.id * 13 % 10));
      }

      if (filtered.length > 0) {
        finalCategories.push({ name: cat.name, movies: filtered });
      }
    }
    return finalCategories;
  }, [rawCategories, filter, activeGenre]);

  const top10Movies = useMemo(() => {
    const allMovies = [];
    for (const cat of categories) {
      for (const m of cat.movies) {
        if (!allMovies.find(x => x.id === m.id)) allMovies.push(m);
      }
    }
    return allMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 10);
  }, [categories]);

  const lastWatched = continueWatching && continueWatching.length > 0 ? continueWatching[0] : null;

  const recommendations = useMemo(() => {
    if (!lastWatched) return [];
    const lastWatchedGenres = lastWatched.genres || [];
    if (lastWatchedGenres.length === 0) return [];
    
    const cwIds = new Set((continueWatching || []).map(m => m.id));
    const allMovies = [];
    for (const cat of rawCategories) {
      for (const m of cat.movies) {
        if (!cwIds.has(m.id) && !allMovies.find(x => x.id === m.id)) {
          allMovies.push(m);
        }
      }
    }
    
    const recs = allMovies.filter(m => (m.genres || []).some(g => lastWatchedGenres.includes(g)));
    return recs.sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0)).slice(0, 15);
  }, [lastWatched, continueWatching, rawCategories]);

  const activeFeaturedMovie = useMemo(() => {
    let pool = [];
    if (featuredMovies.length > 0) {
      featuredMovies.forEach(fm => {
        if (filter === 'series' && fm.isSeries) pool.push(fm);
        else if (filter === 'movies' && !fm.isSeries) pool.push(fm);
        else if (filter === 'anime' && (fm.genres?.includes('Animation') && fm.audioLanguages?.includes('Japanese'))) pool.push(fm);
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
            <img 
              src={activeFeaturedMovie.backdropUrl || activeFeaturedMovie.posterUrl || activeFeaturedMovie.poster}
              alt={activeFeaturedMovie.title}
              className="hero-bg" 
              fetchpriority="high"
              loading="eager"
              decoding="async"
              style={{ willChange: 'transform' }} 
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

      {/* Genre Filter Chips */}
      {!loading && categories.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none', padding: '0.5rem 0 1.5rem', marginBottom: '0.5rem' }}>
          {GENRE_OPTIONS.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              style={{
                background: activeGenre === genre ? '#fff' : 'rgba(255,255,255,0.08)',
                color: activeGenre === genre ? '#000' : '#fff',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '100px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Categories Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <h2 className="section-title">{title}</h2>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
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
           <h3 style={{ textAlign: 'center', color: '#a1a1aa' }}>No titles found</h3>
        ) : (
          <>
            {continueWatching && continueWatching.length > 0 && filter === 'all' && (
              <MovieRail category={{ name: 'Continue Watching', movies: continueWatching }} />
            )}
            {filter === 'all' && lastWatched && recommendations.length > 0 && (
              <MovieRail category={{ name: `Because you watched ${lastWatched.title}`, movies: recommendations }} />
            )}
            {myList && myList.length > 0 && filter === 'all' && (
              <MovieRail category={{ name: 'My List', movies: myList }} />
            )}
            {filter === 'all' && top10Movies.length > 0 && activeGenre === 'All' && (
              <Top10Rail movies={top10Movies} />
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
