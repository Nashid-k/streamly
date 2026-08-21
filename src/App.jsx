import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Home, Compass, Bookmark, Clock, User, Play, X, Menu, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import HomePage from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import PersonDetails from './pages/PersonDetails';
import SearchPage from './pages/SearchPage';
import WatchlistPage from './pages/WatchlistPage';
import HistoryPage from './pages/HistoryPage';
import GenrePage from './pages/GenrePage';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delay = setTimeout(() => {
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

          const results = (data?.movies || []).map(mapSource);
          
          // Filter out duplicate IDs
          const seen = new Set();
          const unique = results.filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });

          setResults(unique.slice(0, 10));
          setLoading(false);
          setError(null);
        })
        .catch(() => {
          setResults([]);
          setLoading(false);
          setError('Failed to reach server. Please try again later.');
        });
    }, 400);


    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    setShowDropdown(false);
    setQuery('');
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setShowDropdown(false);
    }
  };

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

          {/* Hamburger button for mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className={`nav-links ${mobileMenuOpen ? 'nav-links-open' : ''}`}>
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
            <Link to="/anime" className={`nav-item ${location.pathname.includes('/anime') ? 'active' : ''}`}>
              Anime
            </Link>
            <Link to="/mylist" className={`nav-item ${location.pathname === '/mylist' ? 'active' : ''}`}>
              My List
            </Link>
          </div>
        </div>

        <div className="nav-right">
          <div ref={searchRef} className="search-wrapper" style={{ position: 'relative' }}>
            <Search 
              size={18} 
              className="search-icon" 
              onClick={() => {
                const input = searchRef.current?.querySelector('input');
                if (input) input.focus();
              }}
              style={{ cursor: 'pointer' }}
            />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search movies, shows, genres..." 
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => { if(query) setShowDropdown(true); }}
              onKeyDown={handleSearchKeyDown}
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
                     <div style={{display:'flex', flexDirection:'column'}}>
                       {[1, 2, 3, 4].map((i) => (
                         <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                           <div className="skeleton" style={{ width: '50px', height: '75px', borderRadius: '4px' }}></div>
                           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                             <div className="skeleton" style={{ width: '60%', height: '1rem', borderRadius: '4px' }}></div>
                             <div className="skeleton" style={{ width: '30%', height: '0.8rem', borderRadius: '4px' }}></div>
                           </div>
                         </div>
                       ))}
                     </div>
                  ) : error ? (
                     <div style={{padding:'3rem', textAlign:'center', color:'#ef4444'}}>{error}</div>
                  ) : results.length > 0 ? (
                     <div style={{display:'flex', flexDirection:'column'}}>
                       {results.map((r, i) => (
                         <motion.div 
                           key={`${r.id}-${i}`}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: i * 0.05, duration: 0.2 }}
                           onClick={() => {
                             navigate(`/movie/${r.source}/${r.id}`);
                             setQuery('');
                             setShowDropdown(false);
                           }}
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
                         </motion.div>
                       ))}
                       {/* See all results link */}
                       <div
                         onClick={() => {
                           navigate(`/search?q=${encodeURIComponent(query)}`);
                           setQuery('');
                           setShowDropdown(false);
                         }}
                         style={{
                           padding: '0.85rem 1rem',
                           textAlign: 'center',
                           color: '#fb923c',
                           fontWeight: 600,
                           fontSize: '0.9rem',
                           cursor: 'pointer',
                           borderTop: '1px solid rgba(255,255,255,0.08)',
                           transition: 'background 0.2s'
                         }}
                         onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                         onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                       >
                         See all results for "{query}" →
                       </div>
                     </div>
                  ) : (
                     <div style={{padding:'3rem', textAlign:'center', color:'#a1a1aa'}}>No results found for "{query}"</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications Dropdown */}
          <div ref={notificationsRef} style={{ position: 'relative', marginRight: '1rem', display: 'flex', alignItems: 'center' }}>
            <div
              className="user-avatar"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'transparent', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
            >
              <Bell size={20} color="#e4e4e7" />
              <div style={{ position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></div>
            </div>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '120%',
                    right: -10,
                    background: '#09090b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 40px -8px rgba(0,0,0,0.9)',
                    padding: '8px 0',
                    width: '300px',
                    zIndex: 200
                  }}
                >
                  <div style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px', color: '#fff' }}>Notifications</div>
                  <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: '0.9rem', color: '#e4e4e7' }}>New episode of Game of Thrones is out!</div>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>2 hours ago</div>
                  </div>
                  <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: '0.9rem', color: '#e4e4e7' }}>Your watchlist item Inception is trending!</div>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>1 day ago</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar with Dropdown */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <div
              className="user-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <User size={20} />
            </div>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    background: '#09090b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 40px -8px rgba(0,0,0,0.9)',
                    padding: '8px 0',
                    minWidth: '180px',
                    zIndex: 200
                  }}
                >
                  <Link
                    to="/mylist"
                    onClick={() => setShowUserMenu(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '0.9rem', color: '#e4e4e7', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Bookmark size={16} /> My List
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setShowUserMenu(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '0.9rem', color: '#e4e4e7', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Clock size={16} /> Watch History
                  </Link>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '0.9rem', color: '#52525b', cursor: 'default' }}
                    title="Coming Soon"
                  >
                    ⚙️ Settings
                    <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Soon</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Main Content Area with Page Transitions */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

import { ServerWakeupNotification } from './ServerWakeupNotification';

function App() {
  return (
    <Router>
      <ServerWakeupNotification />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage filter="all" title="Trending Across Platforms" />} />
          <Route path="/series" element={<HomePage filter="series" title="Top TV Series" />} />
          <Route path="/movies" element={<HomePage filter="movies" title="Blockbuster Movies" />} />
          <Route path="/new" element={<HomePage filter="new" title="New & Popular Arrivals" />} />
          <Route path="/anime" element={<HomePage filter="anime" title="Anime Collection" />} />
          <Route path="/mylist" element={<WatchlistPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/genre/:genre" element={<GenrePage />} />
          <Route path="/movie/:platform/:id" element={<MovieDetails />} />
          <Route path="/person/:id" element={<PersonDetails />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
