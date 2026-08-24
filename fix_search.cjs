const fs = require('fs');

function patchFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'Series'/g, "'TV Shows'");
  content = content.replace(/filterType === 'Series'/g, "filterType === 'TV Shows'");
  fs.writeFileSync(file, content);
}

patchFile('frontend/src/pages/SearchPage.jsx');
patchFile('frontend/src/pages/WatchlistPage.jsx');
patchFile('frontend/src/pages/GenrePage.jsx');
patchFile('frontend/src/pages/CategoryPage.jsx');
