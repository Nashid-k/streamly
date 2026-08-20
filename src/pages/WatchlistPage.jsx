import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Bookmark, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyList } from '../hooks/useUserData';

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { myList, toggleMyList } = useMyList();
  
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('Date Added');

  const filteredAndSortedList = useMemo(() => {
    let list = [...myList];
    if (filterType === 'Movies') list = list.filter(m => !m.isSeries);
    else if (filterType === 'Series') list = list.filter(m => m.isSeries);
    
    if (sortBy === 'Title A–Z') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'Rating') {
      list.sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
    }
    if (sortBy === 'Date Added') {
      list.reverse();
    }
    return list;
  }, [myList, filterType, sortBy]);

  return (
    <div className="main-content" style={{ padding: '0 3rem 4rem', minHeight: '80vh' }}>
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="section-title" style={{ margin: 0, fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              My List
              <span style={{ fontSize: '1rem', background: 'rgba(255,255,255,0.1)', padding: '2px 12px', borderRadius: '100px', fontWeight: 600, color: '#a1a1aa' }}>
                {myList.length}
              </span>
            </h1>
          </div>
          {myList.length > 0 && (
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
                <option value="Date Added">Date Added</option>
                <option value="Title A–Z">Title A–Z</option>
                <option value="Rating">Highest Rating</option>
              </select>
            </div>
          )}
        </div>
        {myList.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', color: '#a1a1aa' }}>
            <Bookmark size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Your list is empty</h2>
            <p style={{ marginBottom: '2rem' }}>Add movies and series to your list to watch them later.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">Discover Content</button>
          </div>
        ) : filteredAndSortedList.length === 0 ? (
           <div style={{ padding: '4rem 0', textAlign: 'center', color: '#a1a1aa' }}>No items match this filter.</div>
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
                  transition={{ duration: 0.2 }}
                  style={{ position: 'relative' }}
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
                        </div>
                      </div>
                    </div>
                  </Link>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMyList(movie); }}
                    style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                    title="Remove from List"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
