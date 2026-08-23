const fs = require('fs');
const files = [
  'frontend/src/pages/Home.jsx',
  'frontend/src/pages/CategoryPage.jsx',
  'frontend/src/pages/SearchPage.jsx',
  'frontend/src/pages/HistoryPage.jsx',
  'frontend/src/pages/WatchlistPage.jsx',
  'frontend/src/pages/GenrePage.jsx',
  'frontend/src/pages/MovieDetails.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Inject SERIES badge inside poster-wrapper
  const badgeHtml = `<div className="card-overlay">
                      {movie.isSeries && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', color: '#fb923c', padding: '3px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em', border: '1px solid rgba(251,146,60,0.3)' }}>
                          SERIES
                        </div>
                      )}`;
                      
  content = content.replace(/<div className="card-overlay">/g, badgeHtml);
  fs.writeFileSync(file, content);
}
