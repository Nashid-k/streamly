import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PersonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    fetch(`${API_URL}/movies/person/${id}`)
      .then(res => res.json())
      .then(data => {
        setPerson(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <h3>Loading actor profile...</h3>
      </div>
    );
  }

  if (!person) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#a1a1aa' }}>
        <h2>Actor not found</h2>
        <button className="btn btn-glass" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Dynamic Blurred Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '60vh',
        backgroundImage: `url(${person.profileUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(80px) brightness(0.2)',
        zIndex: -1,
      }}></div>

      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate(-1)}
          className="btn btn-glass"
          style={{ padding: '8px 16px', borderRadius: '100px', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
        {/* Profile Image */}
        <div style={{ flexShrink: 0 }}>
          {person.profileUrl ? (
            <img 
              src={person.profileUrl} 
              alt={person.name} 
              style={{
                width: '300px',
                height: '450px',
                objectFit: 'cover',
                borderRadius: '1.25rem',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)'
              }} 
            />
          ) : (
            <div style={{ width: '300px', height: '450px', background: '#18181b', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#a1a1aa' }}>No Image</span>
            </div>
          )}
        </div>

        {/* Person Info */}
        <div style={{ flex: 1, minWidth: '300px', paddingTop: '1rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-0.03em' }}>
            {person.name}
          </h1>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', color: '#a1a1aa', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>
              {person.knownFor || 'Acting'}
            </span>
            {person.birthday && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>
                <Calendar size={16} /> {person.birthday}
              </span>
            )}
            {person.placeOfBirth && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>
                <MapPin size={16} /> {person.placeOfBirth}
              </span>
            )}
          </div>

          {person.biography && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>Biography</h3>
              <p style={{ color: '#d4d4d8', lineHeight: 1.8, fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
                {person.biography}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Credits Grid */}
      {person.credits && person.credits.length > 0 && (
        <section>
          <div className="section-header">
            <h2 className="section-title">Known For</h2>
          </div>
          <div className="movie-grid" style={{ marginTop: '1.5rem' }}>
            {person.credits.map((movie, idx) => (
              <motion.div 
                key={`${movie.id}-${idx}`} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={`/movie/${movie.source || 'nflix'}/${movie.id}`}>
                  <div className="movie-card">
                    <div className="poster-wrapper">
                      <img src={movie.posterUrl} alt={movie.title} className="movie-poster" />
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
                        <span>{movie.isSeries ? 'Series' : 'Movie'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
