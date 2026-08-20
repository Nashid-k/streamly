import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GenrePage() {
  const { genre } = useParams();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('Popularity');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    fetch(`${API_URL}/movies/search?q=${encodeURIComponent(genre)}&platform=nflix`)
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
        
        // Filter to ensure the genre matches to prevent dirty search results
        const strict = mapped.filter(m => {
           if (m.genres && m.genres.some(g => g.toLowerCase() === genre.toLowerCase())) return true;
           if (m.tags && m.tags.some(t => t.toLowerCase() === genre.toLowerCase())) return true;
           return false;
        });

        // If strict is too small, fallback to search results
        const finalResults = strict.length > 3 ? strict : mapped;

        // Deduplicate
        const seen = new Set();
        const unique = finalResults.filter(m => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        setResults(unique);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load genre results.');
        setLoading(false);
      });
  }, [genre]);

  const filteredAndSortedList = useMemo(() => {
    let list = [...results];
    
    if (filterType === 'Movies') list = list.filter(m => !m.isSeries);
    else if (filterType === 'Series') list = list.filter(m => m.isSeries);
    
    if (sortBy === 'Rating') {
      list.sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
    } else if (sortBy === 'Year') {
      list.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
    } else if (sortBy === 'Popularity') {
      list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }
    
    return list;
  }, [results, filterType, sortBy]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Hero Banner */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '40vh', background: 'linear-gradient(135deg, #27272a 0%, #09090b 100%)', zIndex: -1, opacity: 0.6 }} />
      <div style={{ position: 'absolute', top: '10vh', left: 0, width: '100%', height: '30vh', background: 'linear-gradient(to bottom, transparent, #000)', zIndex: -1 }} />

      <div className="main-content" style={{ padding: '4rem 3rem', minHeight: '80vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem', fontSize: '3.5rem', fontWeight: 800, textTransform: 'capitalize' }}>
                {genre}
              </h1>
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '1.1rem' }}>Browse top titles in {genre}</p>
            </div>
            
            {results.length > 0 && (
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['All', 'Movies', 'Series'].map(f => (
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
                  <option value="Popularity">Popularity</option>
                  <option value="Rating">Top Rated</option>
                  <option value="Year">Newest Release</option>
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
          ) : filteredAndSortedList.length === 0 ? (
            <div style={{ padding: '6rem 0', textAlign: 'center', color: '#a1a1aa' }}>
              <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>No titles found</h2>
              <p>We couldn't find any titles in this genre.</p>
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
    </div>
  );
}
