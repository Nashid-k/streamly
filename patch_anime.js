const fs = require('fs');

const files = [
  'frontend/src/pages/Home.jsx',
  'frontend/src/pages/CategoryPage.jsx'
];

const newAnimeDomains = `
      // Anime Domains
      const allAnime = allMoviesList.filter(m => m.genres?.includes('Animation'));
      
      const topRatedAnime = allAnime.filter(m => m.imdbRating >= 7.5);
      if (topRatedAnime.length > 3 && !aggregated.find(c => c.name === 'Top Rated Anime')) {
        aggregated.push({ name: 'Top Rated Anime', movies: topRatedAnime.sort((a,b) => b.imdbRating - a.imdbRating) });
      }

      const actionAnime = allAnime.filter(m => m.genres?.includes('Action') || m.genres?.includes('Fantasy'));
      if (actionAnime.length > 3 && !aggregated.find(c => c.name === 'Action & Fantasy Anime')) {
        aggregated.push({ name: 'Action & Fantasy Anime', movies: actionAnime.sort(() => 0.5 - Math.random()) });
      }
      
      const bingeAnime = allAnime.filter(m => m.isSeries);
      if (bingeAnime.length > 3 && !aggregated.find(c => c.name === 'Binge-Worthy Anime')) {
        aggregated.push({ name: 'Binge-Worthy Anime', movies: bingeAnime.sort(() => 0.5 - Math.random()) });
      }
      
      // Sort categories logically
`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\/\/\s*Sort categories logically/g, newAnimeDomains);
  fs.writeFileSync(file, content);
}
