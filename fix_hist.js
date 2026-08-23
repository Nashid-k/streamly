const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/HistoryPage.jsx', 'utf8');

content = content.replace(/<div className="movie-grid"[\s\S]*?<AnimatePresence[^>]*>/, 
  `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>`);

content = content.replace(/<\/AnimatePresence>\s*<\/div>/, `</div>`);

fs.writeFileSync('frontend/src/pages/HistoryPage.jsx', content);
