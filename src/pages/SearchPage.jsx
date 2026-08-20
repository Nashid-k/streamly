import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('Relevance');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    fetch(`${API_URL}/movies/search?q=${encodeURIComponent(query)}&platform=nflix`)
      .then(res => res.json())
      .then(data => {
        const mapSource = (m) => {
          let source = 'nflix';
          let sourceName = 'Netflix';
          if (m.availablePlatforms && m.availablePlatforms.length > 0) {
            if (m.availablePlatforms.includes('Prime Video')) { source = 'nprime'; sourceName = 'Prime Video'; }
            else if (m.availablePlatforms.includes('Netflix')) { source = 'nflix'; sourceName = 'Netflix'; }
            else if (m.availablePlatforms.includes('Hotstar')) { source = 'hotstar'; sourceName = 'Hotstar'; }
          }
          return { ...m, source, sourceName };
        };
        const mapped = (data?.movies || []).map(mapSource);
        
        // Deduplicate
        const seen = new Set();
        const unique = mapped.filter(m => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        setResults(unique);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load search results.');
        setLoading(false);
      });
  }, [query]);

  const filteredAndSortedList = useMemo(() => {
    let list = [...results];
    
    if (filterType === 'Movies') list = list.filter(m => !m.isSeries);
    else if (filterType === 'Series') list = list.filter(m => m.isSeries);
    else if (filterType === 'Anime') list = list.filter(m => (m.genres || []).includes('Animation') || (m.audioLanguages || []).includes('Japanese'));
    
    if (sortBy === 'Rating') {
      list.sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
    } else if (sortBy === 'Year (Newest)') {
      list.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
    } else if (sortBy === 'Year (Oldest)') {
      list.sort((a, b) => (a.releaseYear || 0) - (b.releaseYear || 0));
    }
    // Relevance keeps original order
    
    return list;
  }, [results, filterType, sortBy]);

  return (
    <div className="main-content" style={{ padding: '0 3rem 4rem', minHeight: '80vh' }}>
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="section-title" style={{ margin: 0, fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Search results for "{query}"
              <span style={{ fontSize: '1rem', background: 'rgba(255,255,255,0.1)', padding: '2px 12px', borderRadius: '100px', fontWeight: 600, color: '#a1a1aa' }}>
                {results.length}
              </span>
            </h1>
          </div>
          
          {results.length > 0 && (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['All', 'Movies', 'Series', 'Anime'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setFilterType(f)}
                    style={{ background: filterType === f ? '#fff' : 'rgba(255,255,255,0.08)', color: filterType === f ? '#000' : '#fff', border: 'none', padding: '6px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{ background: '#18181b', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Relevance">Relevance</option>
                <option value="Rating">Rating</option>
                <option value="Year (Newest)">Year (Newest)</option>
                <option value="Year (Oldest)">Year (Oldest)</option>
              </select>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="movie-grid" style={{ marginTop: '1rem' }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="skeleton skeleton-card" style={{ height: '350px' }}></div>
            ))}
          </div>
        ) : error ? (
           <div style={{ padding: '4rem 0', textAlign: 'center', color: '#ef4444', fontSize: '1.2rem' }}>{error}</div>
        ) : !query ? (
           <div style={{ padding: '4rem 0', textAlign: 'center', color: '#a1a1aa' }}>Type something in the search bar above.</div>
        ) : filteredAndSortedList.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', color: '#a1a1aa' }}>
            <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>No results found</h2>
            <p style={{ marginBottom: '2rem' }}>Try searching for a different title, actor, or genre.</p>
          </div>
        ) : (
          <div className="movie-grid" style={{ marginTop: '1rem' }}>
            <AnimatePresence mode="popLayout">
              {filteredAndSortedList.map((movie, idx) => (
                <motion.div
                  key={movie.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: (idx % 12) * 0.03 }}
                >
                  <Link to={`/movie/${movie.source || 'nflix'}/${movie.id}`}>
                    <div className="movie-card">
                      <div className="poster-wrapper">
                        <img src={movie.posterUrl || movie.backdropUrl} alt={movie.title} className="movie-poster" />
                        <div className="card-overlay">
                          <div className="play-circle"><Play size={24} fill="currentColor" stroke="none" style={{ marginLeft: '4px' }} /></div>
                        </div>
                      </div>
                      <div className="movie-info">
                        <h3 className="movie-title">{movie.title}</h3>
                        <div className="movie-meta">
                          <span>{movie.releaseYear || movie.year}</span>
                          {movie.imdbRating > 0 && <span style={{ color: '#fbbf24' }}>⭐ {movie.imdbRating}</span>}
                          <span>{movie.isSeries ? 'Series' : 'Movie'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
