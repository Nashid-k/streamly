import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, ArrowLeft, Star, Clock, Calendar, Plus, Check, ChevronLeft, ChevronRight, X, MonitorPlay, Volume2, VolumeX, Share2, SkipForward, SkipBack } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useMyList, useContinueWatching } from '../hooks/useUserData';

const getNumericId = (id) => id.replace(/^tmdb-(tv|movie)-/, '');

const decodeUrl = (encodedStr) => {
  if (!encodedStr || encodedStr.startsWith('http')) return encodedStr;
  try {
    const secret = 'STREAMLY_SECURE';
    const decodedB64 = atob(encodedStr);
    return decodedB64.split('').map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length))).join('');
  } catch(e) { return encodedStr; }
};

const SERVERS = [
  { name: 'Server 1', url: (id, s, e) => s ? `https://vidsrc.to/embed/tv/${getNumericId(id)}/${s}/${e}` : `https://vidsrc.to/embed/movie/${getNumericId(id)}` },
  { name: 'Server 2', url: (id, s, e) => s ? `https://vidsrc.me/embed/tv?tmdb=${getNumericId(id)}&season=${s}&episode=${e}` : `https://vidsrc.me/embed/movie?tmdb=${getNumericId(id)}` },
  { name: 'Server 3', url: (id, s, e) => s ? `https://www.2embed.cc/embedtv/${getNumericId(id)}&s=${s}&e=${e}` : `https://www.2embed.cc/embed/${getNumericId(id)}` },
  { name: 'Server 4', url: (id, s, e) => s ? `https://vidsrc.pro/embed/tv/${getNumericId(id)}/${s}/${e}` : `https://vidsrc.pro/embed/movie/${getNumericId(id)}` },
  { name: 'Server 5', url: (id, s, e) => s ? `https://multiembed.mov/directstream.php?video_id=${getNumericId(id)}&tmdb=1&s=${s}&e=${e}` : `https://multiembed.mov/directstream.php?video_id=${getNumericId(id)}&tmdb=1` }
];

// ─── Animation Variants ───────────────────────────────────────────────────────

// Master page entrance — staggered children
const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

// Slide up from below
const slideUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 28, mass: 0.8 }
  }
};

// Slide up subtle (for smaller items)
const slideUpSm = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 30 }
  }
};

// Fade in only
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
};

// Scale + fade for cards
const cardVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  show: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 26 }
  }
};

// Similar movies grid stagger
const gridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.05 }
  }
};

// Cast rail stagger
const castContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 }
  }
};

const castItemVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 12 },
  show: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 28 }
  }
};

// Episodes stagger
const episodesContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const episodeVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 26 }
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MovieDetails() {
  const { platform, id } = useParams();
  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [showCopied, setShowCopied] = useState(false);

  const { isInList, toggleMyList } = useMyList();
  const { continueWatching, updateProgress } = useContinueWatching();

  const [isPlaying, setIsPlaying] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [playMode, setPlayMode] = useState('movie');
  const [playingServerIndex, setPlayingServerIndex] = useState(0);
  const [playingEpisode, setPlayingEpisode] = useState(1);

  // Trigger loading state when iframe src/key is about to change
  useEffect(() => {
    if (isPlaying) setIframeLoading(true);
  }, [isPlaying, playMode, playingServerIndex, playingEpisode, selectedSeason]);
  const castRailRef = useRef(null);
  const pageRef = useRef(null);

  // Scroll-based parallax for backdrop
  const { scrollY } = useScroll();
  const backdropY = useTransform(scrollY, [0, 600], [0, 80]);
  const backdropScale = useTransform(scrollY, [0, 600], [1, 1.08]);

  const scrollCast = (dir) => {
    if (castRailRef.current) {
      castRailRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    fetch(`${API_URL}/movies/${id}?platform=${platform}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.statusCode) {
          setMovie(data);
          if (data.isSeries && data.seasonsCount > 0) {
            // See if we have saved progress
            const saved = continueWatching.find(m => m.id === data.id);
            const seasonToLoad = saved && saved.savedSeason ? saved.savedSeason : 1;
            const episodeToLoad = saved && saved.savedEpisode ? saved.savedEpisode : 1;
            
            setSelectedSeason(seasonToLoad);
            setPlayingEpisode(episodeToLoad);
            fetchEpisodes(data.id, seasonToLoad, platform);
          }
        }
        setLoading(false);
      })
      .catch(console.error);

    fetch(`${API_URL}/movies/${id}/similar?platform=${platform}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSimilar(data); })
      .finally(() => setLoading(false));

    window.scrollTo(0, 0);
  }, [platform, id]);

  useEffect(() => {
    if (movie && movie.isSeries && movie.id === id) {
      let isMounted = true;
      setEpisodesLoading(true);
      setEpisodes([]); // clear stale episodes immediately
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      fetch(`${API_URL}/movies/${id}/season/${selectedSeason}?platform=${platform}`)
        .then(res => res.json())
        .then(data => { if (isMounted && Array.isArray(data)) setEpisodes(data); })
        .catch(console.error)
        .finally(() => { if (isMounted) setEpisodesLoading(false); });
      return () => { isMounted = false; };
    }
  }, [selectedSeason, movie, id, platform]);

  useEffect(() => {
    document.body.style.overflow = isPlaying ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isPlaying]);

  // Close player on Escape key
  useEffect(() => {
    if (!isPlaying) return;
    const handleKey = (e) => { if (e.key === 'Escape') setIsPlaying(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying]);

  const [showBgTrailer, setShowBgTrailer] = useState(false);
  // isBgTrailerReady flips true only AFTER the iframe fires onLoad — this is
  // what drives all visual transitions (backdrop swap, poster/cast hide, mute btn).
  // showBgTrailer merely mounts the iframe so it can buffer silently first.
  const [isBgTrailerReady, setIsBgTrailerReady] = useState(false);
  const [isBgMuted, setIsBgMuted] = useState(true);
  const bgIframeRef = useRef(null);

  useEffect(() => {
    let timer;
    if (!loading && movie && movie.trailerUrl && !isPlaying) {
      timer = setTimeout(() => setShowBgTrailer(true), 5000);
    } else {
      setShowBgTrailer(false);
      setIsBgTrailerReady(false);
      setIsBgMuted(true);
    }
    return () => clearTimeout(timer);
  }, [loading, movie, isPlaying]);

  // Reset ready state when trailer is unmounted
  useEffect(() => {
    if (!showBgTrailer) setIsBgTrailerReady(false);
  }, [showBgTrailer]);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'onStateChange' && data.info === 0) { setShowBgTrailer(false); setIsBgTrailerReady(false); }
        else if (data.event === 'infoDelivery' && data.info && data.info.playerState === 0) { setShowBgTrailer(false); setIsBgTrailerReady(false); }
      } catch(err) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) {
    return (
      <div className="main-content" style={{ padding: '0 3rem' }}>
        <div className="details-content-wrapper">
          <div className="skeleton details-poster-large"></div>
          <div className="details-text" style={{ flex: 1 }}>
            <div className="skeleton skeleton-title" style={{ width: '60%', height: '3rem', marginBottom: '1.5rem' }}></div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div className="skeleton" style={{ width: '40px', height: '1.2rem' }}></div>
              <div className="skeleton" style={{ width: '60px', height: '1.2rem' }}></div>
              <div className="skeleton" style={{ width: '80px', height: '1.2rem' }}></div>
            </div>
            <div className="skeleton" style={{ width: '100%', height: '1rem', marginBottom: '0.8rem' }}></div>
            <div className="skeleton" style={{ width: '90%', height: '1rem', marginBottom: '0.8rem' }}></div>
            <div className="skeleton" style={{ width: '95%', height: '1rem', marginBottom: '2rem' }}></div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="skeleton" style={{ width: '120px', height: '48px', borderRadius: '100px' }}></div>
              <div className="skeleton" style={{ width: '120px', height: '48px', borderRadius: '100px' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return <div className="loading-container"><h2>Movie not found.</h2></div>;
  }

  const sourceName = platform === 'nflix' ? 'Netflix' : platform === 'nprime' ? 'Prime Video' : 'Hotstar';

  return (
    <div ref={pageRef} style={{ position: 'relative', marginTop: '-2rem', paddingTop: '2rem' }}>

      {/* ── Backdrop ─────────────────────────────────────────────────────────── */}
      <div className="details-backdrop" style={{ height: '92vh', overflow: 'hidden', top: '0', left: '-3rem', width: 'calc(100% + 6rem)', marginTop: '-2rem' }}>
        <AnimatePresence mode="wait">
          {!isBgTrailerReady ? (
            <motion.img
              key="bg-img"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              src={movie.backdropUrl || movie.posterUrl}
              alt="Backdrop"
              style={{ y: backdropY, scale: backdropScale }}
              onError={(e) => { e.currentTarget.style.opacity = '0'; }}
            />
          ) : (
            <motion.div
              key="bg-video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            />
          )}
        </AnimatePresence>

        {/* Iframe: mounted silently as soon as showBgTrailer fires so it buffers;
            visually revealed only once isBgTrailerReady=true (onLoad fired) */}
        {showBgTrailer && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            opacity: isBgTrailerReady ? 1 : 0,
            transition: isBgTrailerReady ? 'opacity 1.8s ease-in-out' : 'none',
          }}>
            <iframe
              ref={bgIframeRef}
              src={`${decodeUrl(movie.trailerUrl)}&controls=0&mute=1&autoplay=1&enablejsapi=1`}
              style={{ width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.77vh', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.3)', border: 'none' }}
              allow="autoplay; encrypted-media"
              onLoad={() => {
                if (bgIframeRef.current?.contentWindow) {
                  bgIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
                }
                // Small delay so the video has a moment to start painting before we reveal it
                setTimeout(() => setIsBgTrailerReady(true), 800);
              }}
            />
          </div>
        )}

        {/* Side vignettes */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.85) 100%)', pointerEvents: 'none' }} />
        {/* Top fade */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)', pointerEvents: 'none' }} />
        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.92) 25%, rgba(0,0,0,0.6) 55%, transparent 100%)', pointerEvents: 'none' }} />
      </div>

      {/* ── Topbar: Back + Mute ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 10, paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '2rem' }}
      >
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          color: '#d4d4d8', fontWeight: 600, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em',
          background: 'rgba(0,0,0,0.55)', padding: '10px 20px', borderRadius: '100px',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }} className="back-link">
          <ArrowLeft size={18} /> Back to Collection
        </Link>
        <style dangerouslySetInnerHTML={{__html: `
          .back-link:hover { color: #fff !important; background: rgba(255,255,255,0.12) !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important; }
        `}} />

        <AnimatePresence>
          {isBgTrailerReady && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={() => {
                if (bgIframeRef.current?.contentWindow) {
                  bgIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: isBgMuted ? 'unMute' : 'mute' }), '*');
                }
                setIsBgMuted(!isBgMuted);
              }}
              style={{ zIndex: 50, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.8rem', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              whileHover={{ scale: 1.12, background: 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.93 }}
            >
              {isBgMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Main Content Block ────────────────────────────────────────────────── */}
      <motion.div
        className="details-content-wrapper"
        variants={pageVariants}
        initial="hidden"
        animate="show"
      >
        {/* Poster */}
        <AnimatePresence mode="wait">
          {!isBgTrailerReady && (
            <motion.div
              key="poster"
              variants={slideUp}
              exit={{ opacity: 0, scale: 0.88, x: -30, transition: { duration: 0.5, ease: [0.4, 0, 1, 1] } }}
              style={{ position: 'relative', flexShrink: 0 }}
            >
              <div style={{
                position: 'absolute', inset: '-12%',
                background: `url(${movie.posterUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(48px) brightness(0.5)', zIndex: -1,
                borderRadius: '50%', opacity: 0.8
              }} />
              <motion.img
                src={movie.posterUrl}
                alt={movie.title}
                className="details-poster-large"
                whileHover={{ scale: 1.03, y: -6, boxShadow: '0 40px 80px -12px rgba(0,0,0,0.95)' }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                onError={(e) => { e.currentTarget.style.opacity = '0'; }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text content */}
        <motion.div
          className="details-text"
          layout
          style={{
            display: 'flex',
            flexDirection: isBgTrailerReady ? 'row' : 'column',
            width: '100%',
            alignItems: isBgTrailerReady ? 'flex-end' : 'stretch',
            gap: isBgTrailerReady ? '2rem' : '0',
            paddingTop: isBgTrailerReady ? '10vh' : 0,
            transition: 'padding-top 0.7s cubic-bezier(0.16,1,0.3,1)'
          }}
        >
          <motion.div layout style={{ display: 'flex', flexDirection: 'column', width: isBgTrailerReady ? '40%' : '100%' }}>

            {/* Platform tag */}
            <AnimatePresence>
              {!isBgTrailerReady && (
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden', transition: { duration: 0.45 } }}
                >
                  <motion.span
                    className={`source-tag source-${platform}`}
                    style={{ marginBottom: '1.5rem', display: 'inline-block', fontSize: '0.75rem', padding: '6px 14px', letterSpacing: '0.1em' }}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
                  >
                    NOW STREAMING ON {sourceName.toUpperCase()}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logo / Title */}
            <motion.div layout style={{ marginBottom: '1.5rem', minHeight: '80px', display: 'flex', alignItems: 'center' }} variants={slideUp}>
              {movie.logoUrl ? (
                <motion.img
                  src={movie.logoUrl}
                  alt={movie.title}
                  style={{ maxWidth: '400px', maxHeight: '140px', objectFit: 'contain', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.7))' }}
                  initial={{ opacity: 0, y: 20, filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0)) blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.7)) blur(0px)' }}
                  transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <motion.h1
                  style={{ fontSize: 'clamp(2.5rem, 4vw, 4.5rem)', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}
                  initial={{ opacity: 0, y: 24, letterSpacing: '0.02em' }}
                  animate={{ opacity: 1, y: 0, letterSpacing: '-0.04em' }}
                  transition={{ delay: 0.2, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                >
                  {movie.title}
                </motion.h1>
              )}
            </motion.div>

            {/* Meta + genres + description */}
            <AnimatePresence>
              {!isBgTrailerReady && (
                <motion.div
                  variants={slideUp}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, height: 0, overflow: 'hidden', transition: { duration: 0.5, ease: [0.4, 0, 1, 1] } }}
                >
                  {/* Meta pills */}
                  <motion.div
                    className="details-meta"
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem', fontSize: '0.92rem', fontWeight: 600, color: '#a1a1aa' }}
                    variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                    initial="hidden"
                    animate="show"
                  >
                    {[
                      { icon: <Calendar size={15} />, label: (movie.isUpcoming && movie.releaseDate) ? new Date(movie.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : movie.releaseYear, bg: 'rgba(255,255,255,0.06)' },
                      { icon: <Clock size={15} />, label: movie.duration || (movie.isSeries ? 'Series' : 'Movie'), bg: 'rgba(255,255,255,0.06)' },
                      ...(movie.imdbRating > 0 ? [{ icon: '⭐', label: movie.imdbRating, bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' }] : []),
                      { icon: <Star size={15} fill="#fbbf24" color="#fbbf24" />, label: movie.maturityRating || 'PG', bg: 'rgba(251,191,36,0.08)', color: '#fbbf24' },
                      ...(movie.matchScore ? [{ label: `${movie.matchScore}% Match`, bg: 'rgba(74,222,128,0.1)', color: '#4ade80' }] : [])
                    ].map((item, i) => (
                      <motion.span
                        key={i}
                        variants={slideUpSm}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: item.bg || 'rgba(255,255,255,0.06)', padding: '5px 11px', borderRadius: '8px', color: item.color || '#a1a1aa', border: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        {item.icon} {item.label}
                      </motion.span>
                    ))}
                  </motion.div>

                  {/* Genre tags */}
                  <motion.div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                    initial="hidden"
                    animate="show"
                  >
                    {(movie.genres || []).map((genre, i) => (
                      <motion.div
                        key={genre}
                        variants={slideUpSm}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Link
                          to={`/genre/${encodeURIComponent(genre)}`}
                          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', padding: '4px 14px', borderRadius: '100px', fontSize: '0.8rem', color: '#d4d4d8', letterSpacing: '0.03em', cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none', display: 'inline-block' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#d4d4d8'; }}
                        >
                          {genre}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Description */}
                  <motion.p
                    className="details-overview"
                    style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#d4d4d8', letterSpacing: '0.01em', marginBottom: '2.5rem', width: '100%', paddingRight: '2rem' }}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
                  >
                    {movie.longDescription || movie.description}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA Buttons */}
            <motion.div
              layout
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: isBgTrailerReady ? '0' : '3.5rem' }}
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              initial="hidden"
              animate="show"
            >
              {[
                ...((movie.isUpcoming || SERVERS.length === 0) ? [] : [{
                  cls: 'btn btn-primary',
                  style: { fontSize: '1.05rem', padding: '1rem 2rem' },
                  onClick: () => { setPlayMode('movie'); setIsPlaying(true); setPlayingEpisode(1); updateProgress({ ...movie, source: platform, sourceName }, movie.isSeries ? 1 : null, movie.isSeries ? 1 : null); },
                  children: <><Play size={20} fill="currentColor" stroke="none" /> Play Now</>
                }]),
                ...(movie.isUpcoming && movie.trailerUrl ? [{
                  cls: 'btn btn-primary',
                  style: { fontSize: '1.05rem', padding: '1rem 2rem' },
                  onClick: () => { setPlayMode('trailer'); setIsPlaying(true); },
                  children: <><Play size={20} fill="currentColor" stroke="none" /> Watch Trailer</>
                }] : []),
                {
                  cls: 'btn btn-glass',
                  style: { fontSize: '1.05rem', padding: '1rem 2rem' },
                  onClick: () => toggleMyList(movie),
                  children: <>{isInList(movie.id) ? <Check size={20} color="#4ade80" /> : <Plus size={20} />} {isInList(movie.id) ? 'Added' : 'My List'}</>
                },
                {
                  cls: 'btn btn-glass',
                  style: { fontSize: '1.05rem', padding: '1rem 2rem' },
                  onClick: () => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowCopied(true);
                    setTimeout(() => setShowCopied(false), 2000);
                  },
                  children: <>{showCopied ? <Check size={20} color="#4ade80" /> : <Share2 size={20} />} {showCopied ? 'Copied!' : 'Share'}</>
                },
                ...(!movie.isUpcoming && movie.trailerUrl ? [{
                  cls: 'btn btn-glass',
                  style: { fontSize: '1.05rem', padding: '1rem 2rem', background: 'transparent', borderColor: 'rgba(255,255,255,0.25)' },
                  onClick: () => { setPlayMode('trailer'); setIsPlaying(true); },
                  children: <>Watch Trailer</>
                }] : [])
              ].map((btn, i) => (
                <motion.button
                  key={i}
                  variants={slideUpSm}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className={btn.cls}
                  style={btn.style}
                  onClick={btn.onClick}
                >
                  {btn.children}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Director + cast — hidden while bg trailer plays */}
          <AnimatePresence>
            {!isBgTrailerReady && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '2rem',
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                  paddingTop: '2rem',
                  width: '100%',
                }}
              >
                <motion.div variants={fadeIn}>
                  {movie.director && (
                    <motion.div style={{ marginBottom: '1.5rem' }} variants={slideUpSm}>
                      <h3 style={{ fontSize: '0.8rem', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>Director</h3>
                      <p style={{ margin: 0, fontWeight: 500, color: '#e4e4e7', fontSize: '1rem' }}>{movie.director}</p>
                    </motion.div>
                  )}
                  {movie.isSeries && movie.seasonsCount && (
                    <motion.div variants={slideUpSm}>
                      <h3 style={{ fontSize: '0.8rem', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>Series Info</h3>
                      <p style={{ margin: 0, fontWeight: 500, color: '#e4e4e7', fontSize: '1rem' }}>{movie.seasonsCount} Season{movie.seasonsCount > 1 ? 's' : ''}</p>
                    </motion.div>
                  )}
                </motion.div>

                {movie.cast && movie.cast.length > 0 && (
                  <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
                    <motion.h3
                      style={{ fontSize: '0.8rem', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}
                      variants={fadeIn}
                    >
                      Cast
                    </motion.h3>
                    <div style={{ position: 'relative' }} className="cast-rail-wrapper">
                      <motion.button
                        onClick={() => scrollCast('left')}
                        style={{ position: 'absolute', left: '-15px', top: '45px', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(24,24,27,0.85)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                        whileHover={{ scale: 1.12, background: 'rgba(24,24,27,1)' }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ChevronLeft size={20} />
                      </motion.button>

                      <motion.div
                        ref={castRailRef}
                        style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none', maxWidth: '100%' }}
                        className="cast-rail"
                        variants={castContainerVariants}
                        initial="hidden"
                        animate="show"
                      >
                        {movie.cast.map((c, i) => {
                          const isObj = typeof c !== 'string';
                          const name = isObj ? c.name : c;
                          const char = isObj ? c.character : '';
                          const img = isObj && c.profileUrl ? c.profileUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=27272a&color=fff`;

                          const castContent = (
                            <motion.div
                              variants={castItemVariants}
                              whileHover={{ y: -6, scale: 1.04 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '110px', flexShrink: 0, gap: '10px', cursor: 'pointer' }}
                              className="cast-card"
                            >
                              <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', transition: 'border-color 0.3s ease', boxShadow: '0 10px 24px -5px rgba(0,0,0,0.6)' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#fb923c'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                              >
                                <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
                              </div>
                              <div style={{ textAlign: 'center', width: '100%' }}>
                                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f4f4f5', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                                {char && <span style={{ display: 'block', fontSize: '0.7rem', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }}>{char}</span>}
                              </div>
                            </motion.div>
                          );

                          return isObj && c.id ? (
                            <Link to={`/person/${c.id}`} key={c.id || i} style={{ textDecoration: 'none', flexShrink: 0 }}>
                              {castContent}
                            </Link>
                          ) : (
                            <div key={i} style={{ flexShrink: 0 }}>{castContent}</div>
                          );
                        })}
                      </motion.div>

                      <motion.button
                        onClick={() => scrollCast('right')}
                        style={{ position: 'absolute', right: '-15px', top: '45px', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(24,24,27,0.85)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                        whileHover={{ scale: 1.12, background: 'rgba(24,24,27,1)' }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ChevronRight size={20} />
                      </motion.button>
                    </div>
                    <style dangerouslySetInnerHTML={{__html: `
                      .cast-rail::-webkit-scrollbar { height: 4px; }
                      .cast-rail::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
                      .cast-rail::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
                      .cast-rail::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
                    `}} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>

      {/* ── Episodes ─────────────────────────────────────────────────────────── */}
      {movie.isSeries && movie.seasonsCount > 0 && (
        <motion.section
          style={{ marginTop: '2rem', padding: '0 2rem' }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <motion.h2
              className="section-title"
              style={{ margin: 0 }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              Episodes
            </motion.h2>
            <motion.select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              style={{ background: '#18181b', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 1.5rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s' }}
              whileHover={{ borderColor: 'rgba(255,255,255,0.3)' }}
              whileFocus={{ borderColor: 'rgba(255,255,255,0.4)' }}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {Array.from({ length: movie.seasonsCount }, (_, i) => i + 1).map(season => (
                <option key={season} value={season}>Season {season}</option>
              ))}
            </motion.select>
          </div>

          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}
            key={`season-${selectedSeason}-${episodesLoading}`}
            variants={episodesContainerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {episodesLoading ? (
              // Skeleton placeholders while episodes load
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} style={{ background: '#0a0a0d', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9' }}></div>
                  <div style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton" style={{ height: '1rem', width: '60%', borderRadius: '4px' }}></div>
                    <div className="skeleton" style={{ height: '0.8rem', width: '90%', borderRadius: '4px' }}></div>
                    <div className="skeleton" style={{ height: '0.8rem', width: '75%', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))
            ) : episodes.length === 0 ? (
              <p style={{ color: '#52525b', gridColumn: '1/-1', textAlign: 'center', padding: '3rem 0' }}>No episodes found for this season.</p>
            ) : (
              episodes.map((ep, idx) => {
                const isEpPlaying = isPlaying && playingEpisode === ep.episodeNumber && playMode !== 'trailer';
                return (
                <motion.div
                  key={ep.id || idx}
                  variants={episodeVariants}
                  whileHover={{ y: -6, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { if (SERVERS.length > 0) { setIsPlaying(true); setPlayingEpisode(ep.episodeNumber); updateProgress({ ...movie, source: platform, sourceName }, selectedSeason, ep.episodeNumber); } }}
                  style={{ background: isEpPlaying ? 'rgba(229,9,20,0.08)' : '#0a0a0d', borderRadius: '14px', overflow: 'hidden', border: isEpPlaying ? '2px solid #e50914' : '1px solid rgba(255,255,255,0.06)', cursor: SERVERS.length > 0 ? 'pointer' : 'default', opacity: SERVERS.length > 0 ? 1 : 0.6 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                >
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#18181b', overflow: 'hidden' }}>
                    {ep.thumbnailUrl && (
                      <motion.img
                        src={ep.thumbnailUrl}
                        alt={ep.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        decoding="async"
                        whileHover={{ scale: 1.06 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    )}
                    {isEpPlaying && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#e50914', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', zIndex: 10 }}>
                        NOW PLAYING
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.82)', padding: '2px 8px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                      {ep.duration}
                    </div>
                    <motion.div
                      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.22 }}
                    >
                      <motion.div
                        style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}
                        initial={{ scale: 0.7 }}
                        whileHover={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      >
                        <Play size={22} fill="currentColor" stroke="none" style={{ marginLeft: '3px' }} />
                      </motion.div>
                    </motion.div>
                  </div>
                  <div style={{ padding: '1rem 1.1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.4rem', lineHeight: 1.35, color: '#f4f4f5' }}>{ep.episodeNumber}. {ep.title}</h3>
                    <p style={{ fontSize: '0.83rem', color: '#71717a', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.55 }}>
                      {ep.description}
                    </p>
                    {ep.airDate && (
                      <p style={{ fontSize: '0.75rem', color: '#52525b', margin: '0.5rem 0 0', fontWeight: 500 }}>
                        {new Date(ep.airDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </motion.div>
              )})
            )}
          </motion.div>
        </motion.section>
      )}

      {/* ── More Like This ────────────────────────────────────────────────────── */}
      {(loading || (similar && similar.length > 0)) && (
        <motion.section
          style={{ marginTop: '5rem' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            More Like This
          </motion.h2>
          {loading ? (
            <div className="movie-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '12px', marginBottom: '0.5rem' }}></div>
                  <div className="skeleton" style={{ height: '1rem', width: '70%', borderRadius: '4px', marginBottom: '0.4rem' }}></div>
                  <div className="skeleton" style={{ height: '0.8rem', width: '40%', borderRadius: '4px' }}></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="movie-grid"
              variants={gridVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
            >
              {similar.slice(0, 12).map((sim, idx) => (
                <motion.div key={`${sim.id}-${idx}`} variants={cardVariants}>
                  <Link to={`/movie/${platform}/${sim.id}`}>
                    <div className="movie-card">
                      <div className="poster-wrapper">
                        <img
                          src={sim.posterUrl || sim.poster}
                          alt={sim.title}
                          className="movie-poster"
                          loading="lazy"
                          decoding="async"
                          width="220"
                          height="330"
                          onError={e => { e.currentTarget.style.opacity = '0'; }}
                        />
                        <div className="card-overlay">
                          <div className="play-circle">
                            <Play size={24} fill="currentColor" stroke="none" style={{ marginLeft: '4px' }} />
                          </div>
                        </div>
                      </div>
                      <div className="movie-info">
                        <h3 className="movie-title">{sim.title}</h3>
                        <div className="movie-meta">
                          <span>{sim.releaseYear}</span>
                          <span className={`source-tag source-${platform}`}>{sourceName}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.section>
      )}

      {/* ── Video Player Overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', background: playMode === 'trailer' ? 'rgba(0,0,0,0.92)' : '#000', backdropFilter: playMode === 'trailer' ? 'blur(24px)' : 'none' }}
          >
            {playMode === 'trailer' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.12 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9 }}
                style={{ position: 'absolute', inset: 0, backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -1 }}
              />
            )}

            {/* Player header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', background: playMode === 'trailer' ? 'rgba(0,0,0,0.4)' : '#09090b', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 10, backdropFilter: playMode === 'trailer' ? 'blur(12px)' : 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <motion.button
                  onClick={() => setIsPlaying(false)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '100px' }}
                  whileHover={{ background: 'rgba(255,255,255,0.16)', scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <ArrowLeft size={18} /> Back
                </motion.button>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#e4e4e7' }}>
                  {movie.title}{' '}
                  {playMode === 'trailer'
                    ? <span style={{ color: '#71717a', fontWeight: 400 }}>— Official Trailer</span>
                    : movie.isSeries ? `— S${selectedSeason} E${playingEpisode}${episodes.find(e => e.episodeNumber === playingEpisode)?.title ? `: ${episodes.find(e => e.episodeNumber === playingEpisode).title}` : ''}` : ''
                  }
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {movie.isSeries && playMode !== 'trailer' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginRight: '0.75rem' }}>
                    <motion.button
                      onClick={() => {
                        if (playingEpisode > 1) {
                          setPlayingEpisode(prev => prev - 1);
                        } else if (selectedSeason > 1) {
                          // Go to previous season — episodes will load async; start at ep 1 for now
                          setSelectedSeason(prev => prev - 1);
                          setPlayingEpisode(1);
                        }
                      }}
                      disabled={playingEpisode <= 1 && selectedSeason <= 1}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: (playingEpisode <= 1 && selectedSeason <= 1) ? 'not-allowed' : 'pointer', opacity: (playingEpisode <= 1 && selectedSeason <= 1) ? 0.4 : 1 }}
                      whileHover={(playingEpisode > 1 || selectedSeason > 1) ? { scale: 1.04 } : {}}
                      whileTap={(playingEpisode > 1 || selectedSeason > 1) ? { scale: 0.95 } : {}}
                    >
                      Prev
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        if (playingEpisode < episodes.length) {
                          setPlayingEpisode(prev => prev + 1);
                        } else if (selectedSeason < movie.seasonsCount) {
                          // Auto-advance to next season
                          setSelectedSeason(prev => prev + 1);
                          setPlayingEpisode(1);
                        }
                      }}
                      disabled={playingEpisode >= episodes.length && selectedSeason >= movie.seasonsCount}
                      style={{ background: '#e50914', border: 'none', color: 'white', padding: '0.5rem 1.1rem', borderRadius: '8px', cursor: (playingEpisode >= episodes.length && selectedSeason >= movie.seasonsCount) ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: (playingEpisode >= episodes.length && selectedSeason >= movie.seasonsCount) ? 0.4 : 1 }}
                      whileHover={(playingEpisode < episodes.length || selectedSeason < movie.seasonsCount) ? { scale: 1.05, background: '#ff0a16' } : {}}
                      whileTap={(playingEpisode < episodes.length || selectedSeason < movie.seasonsCount) ? { scale: 0.95 } : {}}
                    >
                      {playingEpisode >= episodes.length && selectedSeason < movie.seasonsCount ? 'Next Season' : 'Next Ep'}
                    </motion.button>
                  </div>
                )}
                {playMode !== 'trailer' && (
                  <>
                    <MonitorPlay size={18} color="#52525b" />
                    <select
                      value={playingServerIndex}
                      onChange={e => setPlayingServerIndex(Number(e.target.value))}
                      style={{ background: '#18181b', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '0.55rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                    >
                      {SERVERS.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
                    </select>
                  </>
                )}
                {playMode === 'trailer' && (
                  <>
                    {!movie.isUpcoming && (
                      <motion.button
                        className="btn btn-primary"
                        onClick={() => { setPlayMode('movie'); setPlayingEpisode(1); updateProgress({ ...movie, source: platform, sourceName }, movie.isSeries ? 1 : null, movie.isSeries ? 1 : null); }}
                        style={{ padding: '0.5rem 1.5rem', fontSize: '0.92rem' }}
                        whileHover={{ scale: 1.04, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <Play size={15} fill="currentColor" stroke="none" />
                        Play {movie.isSeries ? 'Series' : 'Movie'}
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => setIsPlaying(false)}
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', marginLeft: '0.25rem' }}
                      whileHover={{ background: 'rgba(255,255,255,0.18)', scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={18} />
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Iframe */}
            <motion.div
              initial={{ opacity: 0, scale: playMode === 'trailer' ? 0.95 : 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              style={{ position: 'relative', flex: 1, background: playMode === 'trailer' ? 'transparent' : 'black', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: playMode === 'trailer' ? '1.5rem 3rem 2.5rem' : '0' }}
            >
              {iframeLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: -1 }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#e50914', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ marginTop: '1rem', color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 500 }}>Loading player...</span>
                </div>
              )}
              <iframe
                key={`${playingServerIndex}-${selectedSeason}-${playingEpisode}`}
                src={playMode === 'trailer' ? decodeUrl(movie.trailerUrl) : SERVERS[playingServerIndex].url(movie.id, movie.isSeries ? selectedSeason : null, movie.isSeries ? playingEpisode : null)}
                onLoad={() => setIframeLoading(false)}
                style={{
                  width: '100%',
                  height: playMode === 'trailer' ? 'min(calc(100vw * 9/16), calc(100vh - 120px))' : '100%',
                  maxWidth: playMode === 'trailer' ? 'min(1400px, calc((100vh - 120px) * 16/9))' : 'none',
                  border: 'none',
                  borderRadius: playMode === 'trailer' ? '20px' : '0',
                  boxShadow: playMode === 'trailer' ? '0 32px 64px -12px rgba(0,0,0,0.9)' : 'none',
                  opacity: iframeLoading ? 0 : 1,
                  transition: 'opacity 0.4s ease'
                }}
                allowFullScreen
              />

              {movie.isSeries && playMode !== 'trailer' && (
                <div style={{ position: 'absolute', bottom: '80px', right: '20px', display: 'flex', gap: '10px', zIndex: 10 }}>
                  {playingEpisode > 1 && (
                    <motion.button
                      className="btn-glass"
                      style={{ background: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                      whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.15)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIframeLoading(true);
                        setPlayingEpisode(prev => prev - 1);
                        updateProgress({ ...movie, source: platform, sourceName }, selectedSeason, playingEpisode - 1);
                      }}
                    >
                      <SkipBack size={16} /> Previous Ep
                    </motion.button>
                  )}
                  {playingEpisode < episodes.length && (
                    <motion.button
                      className="btn-glass"
                      style={{ background: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                      whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.15)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIframeLoading(true);
                        setPlayingEpisode(prev => prev + 1);
                        updateProgress({ ...movie, source: platform, sourceName }, selectedSeason, playingEpisode + 1);
                      }}
                    >
                      Next Ep <SkipForward size={16} />
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
