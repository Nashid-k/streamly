import { Link, useNavigate } from 'react-router-dom';
import { Play, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContinueWatching } from '../hooks/useUserData';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { continueWatching } = useContinueWatching();

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire watch history?")) {
      localStorage.setItem('aios_continue_watching', JSON.stringify([]));
      window.dispatchEvent(new Event('storage'));
      // A full page reload is simplest to resync state if the hook doesn't listen to storage events
      window.location.reload();
    }
  };

  return (
    <div className="main-content" style={{ padding: '0 3rem 4rem', minHeight: '80vh' }}>
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="section-title" style={{ margin: 0, fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Watch History
              <span style={{ fontSize: '1rem', background: 'rgba(255,255,255,0.1)', padding: '2px 12px', borderRadius: '100px', fontWeight: 600, color: '#a1a1aa' }}>
                {continueWatching.length}
              </span>
            </h1>
          </div>
          {continueWatching.length > 0 && (
            <button 
              onClick={clearHistory}
              style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Clear All
            </button>
          )}
        </div>

        {continueWatching.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', color: '#a1a1aa' }}>
            <Clock size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>No watch history yet</h2>
            <p style={{ marginBottom: '2rem' }}>Titles you watch will automatically appear here.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">Discover Content</button>
          </div>
        ) : (
          <div className="movie-grid" style={{ marginTop: '1rem' }}>
            <AnimatePresence mode="popLayout">
              {continueWatching.map((movie, idx) => (
                <motion.div
                  key={movie.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  style={{ position: 'relative' }}
                >
                  <Link to={`/movie/${movie.source || 'nflix'}/${movie.id}`}>
                    <div className="movie-card">
                      <div className="poster-wrapper">
                        <img src={movie.posterUrl || movie.backdropUrl} alt={movie.title} className="movie-poster" />
                        <div className="card-overlay">
                          <div className="play-circle"><Play size={24} fill="currentColor" stroke="none" style={{ marginLeft: '4px' }} /></div>
                        </div>
                        {movie.isSeries && movie.savedSeason && (
                          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.85)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
                            S{movie.savedSeason} E{movie.savedEpisode || 1}
                          </div>
                        )}
                        {!movie.isSeries && (
                          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.85)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
                            Movie
                          </div>
                        )}
                      </div>
                      <div className="movie-info">
                        <h3 className="movie-title">{movie.title}</h3>
                        <div className="movie-meta">
                          {movie.lastWatched && (
                            <span style={{ color: '#a1a1aa' }}>
                              {new Date(movie.lastWatched).toLocaleDateString()}
                            </span>
                          )}
                          {movie.matchScore > 0 && <span style={{ color: '#4ade80' }}>{movie.matchScore}% Match</span>}
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
