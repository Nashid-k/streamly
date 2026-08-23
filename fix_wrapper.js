const fs = require('fs');
const files = [
  'frontend/src/pages/SearchPage.jsx',
  'frontend/src/pages/GenrePage.jsx',
  'frontend/src/pages/WatchlistPage.jsx',
  'frontend/src/pages/HistoryPage.jsx',
  'frontend/src/pages/CategoryPage.jsx'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fill, minmax\(200px, 1fr\)\)', gap: '2rem' \}\}>/g, 
    '<div className="movie-grid" style={{ marginTop: "1rem" }}>');
  fs.writeFileSync(file, content);
}
