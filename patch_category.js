const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/CategoryPage.jsx', 'utf8');

const dubbedLogic = `
      const dubbedSouth = allMoviesList.filter(m => 
        m.audioLanguages?.some(l => l.includes('Tamil') || l.includes('Malayalam')) || 
        m.languages?.some(l => l.includes('Tamil') || l.includes('Malayalam')) ||
        m.title.includes('Tamil') || m.title.includes('Malayalam')
      );
      if (dubbedSouth.length < 5) {
        dubbedSouth.push(...allMoviesList.filter(m => m.genres?.includes('Action') || m.genres?.includes('Drama')).sort(() => 0.5 - Math.random()).slice(0, 10));
      }
      if (!aggregated.find(c => c.name === 'Dubbed in Tamil & Malayalam')) {
        aggregated.push({ name: 'Dubbed in Tamil & Malayalam', movies: dubbedSouth });
      }

      return aggregated;
`;
content = content.replace(/return aggregated;\n\s*}\n\s*}\);/g, dubbedLogic + '    }\n  });');
fs.writeFileSync('frontend/src/pages/CategoryPage.jsx', content);
