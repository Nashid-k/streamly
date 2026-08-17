import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Home, Compass, Bookmark, Clock, User, Play, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import HomePage from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import PersonDetails from './pages/PersonDetails';

// ── Global Navigation Loader ───────────────────────────────────────────────────
function NavigationLoader() {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const prevPath = useRef(location.pathname);
  const timerRef = useRef(null);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      setIsNavigating(true);
      // Automatically dismiss after content has had time to mount
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsNavigating(false), 600);
    }
    return () => clearTimeout(timerRef.current);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          key="nav-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            pointerEvents: 'all',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}
          >
            <div className="spinner" style={{ width: '44px', height: '44px' }} />
            <span style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.04em' }}>Loading…</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delay = setTimeout(() => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      Promise.all([
        fetch(`${API_URL}/movies/search?q=${encodeURIComponent(query)}&platform=nflix`).then(res => res.json()).catch(() => ({movies: []})),
        fetch(`${API_URL}/movies/search?q=${encodeURIComponent(query)}&platform=nprime`).then(res => res.json()).catch(() => ({movies: []})),
        fetch(`${API_URL}/movies/search?q=${encodeURIComponent(query)}&platform=hotstar`).then(res => res.json()).catch(() => ({movies: []}))
      ]).then(([nflixRes, nprimeRes, hotstarRes]) => {
        const merged = [];
        
        const mapSource = (m, defaultSource, defaultName) => {
          let source = defaultSource;
          let sourceName = defaultName;
          if (m.availablePlatforms && m.availablePlatforms.length > 0) {
            if (m.availablePlatforms.includes('Prime Video')) { source = 'nprime'; sourceName = 'Prime Video'; }
            else if (m.availablePlatforms.includes('Netflix')) { source = 'nflix'; sourceName = 'Netflix'; }
            else if (m.availablePlatforms.includes('Hotstar')) { source = 'hotstar'; sourceName = 'Hotstar'; }
          }
          return { ...m, source, sourceName };
        };

        if (nflixRes?.movies) merged.push(...nflixRes.movies.map(m => mapSource(m, 'nflix', 'Netflix')));
        if (nprimeRes?.movies) merged.push(...nprimeRes.movies.map(m => mapSource(m, 'nprime', 'Prime Video')));
        if (hotstarRes?.movies) merged.push(...hotstarRes.movies.map(m => mapSource(m, 'hotstar', 'Hotstar')));
        
        // Filter out duplicate IDs for a cleaner UI
        const seen = new Set();
        const unique = merged.filter(m => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        setResults(unique.slice(0, 10));
        setLoading(false);
      });
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    setShowDropdown(false);
    setQuery('');
  }, [location.pathname]);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <Play size={20} fill="currentColor" stroke="none" style={{ marginLeft: '2px' }} />
            </div>
            Streamly
          </Link>
          
          <div className="nav-links">
            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/series" className={`nav-item ${location.pathname.includes('/series') ? 'active' : ''}`}>
              Series
            </Link>
            <Link to="/movies" className={`nav-item ${location.pathname.includes('/movies') ? 'active' : ''}`}>
              Movies
            </Link>
            <Link to="/new" className={`nav-item ${location.pathname.includes('/new') ? 'active' : ''}`}>
              New & Popular
            </Link>
            <Link to="/mylist" className={`nav-item ${location.pathname.includes('/mylist') ? 'active' : ''}`}>
              My List
            </Link>
          </div>
        </div>

        <div className="nav-right">
          <div className="search-wrapper" style={{ position: 'relative' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search movies, shows, genres..." 
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => { if(query) setShowDropdown(true); }}
            />
            {query && (
              <button 
                onClick={() => {setQuery(''); setShowDropdown(false)}} 
                style={{position:'absolute', right:'12px', top: '50%', transform: 'translateY(-50%)', background:'transparent', border:'none', color:'#a1a1aa', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                <X size={16} />
              </button>
            )}
            
            <AnimatePresence>
              {showDropdown && query && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: '450px',
                    background: '#09090b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.9)',
                    overflow: 'hidden',
                    zIndex: 200,
                    maxHeight: '65vh',
                    overflowY: 'auto'
                  }}
                >
                  {loading ? (
                     <div style={{padding:'3rem', textAlign:'center', color:'#a1a1aa'}}>
                       <div className="spinner" style={{ margin: '0 auto 1rem', width: '24px', height: '24px', borderWidth: '2px' }}></div>
                       Searching across platforms...
                     </div>
                  ) : results.length > 0 ? (
                     <div style={{display:'flex', flexDirection:'column'}}>
                       {results.map((r, i) => (
                         <div 
                           key={`${r.id}-${i}`}
                           onClick={() => navigate(`/movie/${r.source}/${r.id}`)}
                           style={{
                             display: 'flex',
                             alignItems: 'center',
                             gap: '1rem',
                             padding: '0.75rem 1rem',
                             cursor: 'pointer',
                             borderBottom: '1px solid rgba(255,255,255,0.05)',
                             transition: 'background 0.2s'
                           }}
                           onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                           onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                         >
                           <img src={r.posterUrl || r.backdropUrl} alt={r.title} style={{width:'50px', height:'75px', objectFit:'cover', borderRadius:'4px', background: '#18181b'}} />
                           <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '4px'}}>
                             <div style={{fontWeight:600, fontSize:'0.95rem', color: '#fff'}}>{r.title}</div>
                             <div style={{fontSize:'0.8rem', color:'#a1a1aa', display: 'flex', gap: '8px', alignItems: 'center'}}>
                               <span>{r.releaseYear}</span>
                               <span>•</span>
                               <span className={`source-tag source-${r.source}`} style={{ padding: '0px 6px', fontSize: '0.6rem' }}>{r.sourceName}</span>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                  ) : (
                     <div style={{padding:'3rem', textAlign:'center', color:'#a1a1aa'}}>No results found for "{query}"</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="user-avatar">
            <User size={20} />
          </div>
        </div>
      </nav>

      {/* Main Content Area with Page Transitions */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: '6rem 2rem', textAlign: 'center', color: '#a1a1aa' }}>
      <h1 style={{ color: '#fff', marginBottom: '1rem', fontSize: '2.5rem' }}>{title}</h1>
      <p style={{ fontSize: '1.2rem' }}>This feature is currently being built. Check back later!</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <NavigationLoader />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage filter="all" title="Trending Across Platforms" />} />
          <Route path="/series" element={<HomePage filter="series" title="Top TV Series" />} />
          <Route path="/movies" element={<HomePage filter="movies" title="Blockbuster Movies" />} />
          <Route path="/new" element={<HomePage filter="new" title="New & Popular Arrivals" />} />
          <Route path="/mylist" element={<HomePage filter="mylist" title="Your Watchlist" />} />
          <Route path="/movie/:platform/:id" element={<MovieDetails />} />
          <Route path="/person/:id" element={<PersonDetails />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

