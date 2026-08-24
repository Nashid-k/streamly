const fs = require('fs');

// 1. Fix App.jsx routing and sidebar
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Ensure /tv-shows maps to series
app = app.replace(
  /<Route path="\/series" element=\{<HomePage filter="series" title="Top TV Series" \/>\} \/>/,
  `<Route path="/series" element={<HomePage filter="series" title="Top TV Shows" />} />\n              <Route path="/tv-shows" element={<HomePage filter="series" title="Top TV Shows" />} />`
);
// In case they changed to filter="tv shows"
app = app.replace(
  /<Route path="\/series" element=\{<HomePage filter="tv shows" title="Top TV Shows" \/>\} \/>/,
  `<Route path="/series" element={<HomePage filter="series" title="Top TV Shows" />} />\n              <Route path="/tv-shows" element={<HomePage filter="series" title="Top TV Shows" />} />`
);

fs.writeFileSync('frontend/src/App.jsx', app);

// 2. Fix Home.jsx to accept both 'series' and 'tv shows'
let home = fs.readFileSync('frontend/src/pages/Home.jsx', 'utf8');

home = home.replace(/filter === 'series'/g, "(filter === 'series' || filter === 'tv shows')");

fs.writeFileSync('frontend/src/pages/Home.jsx', home);
