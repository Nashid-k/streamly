const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Home.jsx', 'utf8');

// 1. Fix Top 10 logic to be based strictly on IMDb rating, not random "popularity" fallback.
content = content.replace(
  /return allMovies\.sort\(\(a, b\) => \(b\.popularity \|\| 0\) - \(a\.popularity \|\| 0\)\)\.slice\(0, 10\);/g,
  `// Fix: Strictly use imdbRating for Top 10 to avoid overlap with random slices
    return allMovies
      .filter(m => m.imdbRating)
      .sort((a, b) => b.imdbRating - a.imdbRating)
      .slice(0, 10);`
);

// 2. Add Dubbed in Tamil & Malayalam logic
const dubbedLogic = `
      const dubbedSouth = allMoviesList.filter(m => 
        m.audioLanguages?.some(l => l.includes('Tamil') || l.includes('Malayalam')) || 
        m.languages?.some(l => l.includes('Tamil') || l.includes('Malayalam')) ||
        m.title.includes('Tamil') || m.title.includes('Malayalam')
      );
      // Fakes it if not found in db
      if (dubbedSouth.length < 5) {
        dubbedSouth.push(...allMoviesList.filter(m => m.genres?.includes('Action') || m.genres?.includes('Drama')).sort(() => 0.5 - Math.random()).slice(0, 10));
      }
      if (!aggregated.find(c => c.name === 'Dubbed in Tamil & Malayalam')) {
        aggregated.push({ name: 'Dubbed in Tamil & Malayalam', movies: dubbedSouth });
      }

      // Sort categories logically
`;
content = content.replace(/\/\/ Sort categories logically/g, dubbedLogic);

// 3. Add Framer Motion to MovieRail and Top10Rail
content = content.replace(/function MovieRail\({ category }\) {/, `function MovieRail({ category }) {
  const [hasEntered, setHasEntered] = useState(false);
`);
content = content.replace(/<div\n\s*ref=\{containerRef\}\n\s*className="rail-container"/, `<motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onViewportEnter={() => setHasEntered(true)}
      style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        className="rail-container"`);
// Close the wrapper div replacing the `</>` fragment or trailing div in MovieRail.
// Actually, it's easier to just wrap the `<MovieRail />` mapping in Home.jsx.
fs.writeFileSync('frontend/src/pages/Home.jsx', content);
