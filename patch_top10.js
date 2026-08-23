const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/Home.jsx', 'utf8');

// Replace Top 10 logic
const newTop10 = `  const top10Movies = useMemo(() => {
    const allMovies = [];
    for (const cat of rawCategories) {
      for (const m of cat.movies) {
        if (!allMovies.find(x => x.id === m.id)) allMovies.push(m);
      }
    }
    
    // Authentic "Top 10 Today" logic:
    // Real platforms (Netflix) base this on daily trending data. 
    // We can simulate this by seeding a shuffle with today's date string, 
    // ensuring the Top 10 changes every single day at midnight!
    const todaySeed = new Date().toDateString();
    
    // Simple string hash for the seed
    let hash = 0;
    for (let i = 0; i < todaySeed.length; i++) {
      hash = (hash << 5) - hash + todaySeed.charCodeAt(i);
      hash |= 0; 
    }
    
    // Deterministic shuffle based on today's hash
    const shuffled = [...allMovies].sort((a, b) => {
      const hashA = (a.id.toString().charCodeAt(0) * hash) % 100;
      const hashB = (b.id.toString().charCodeAt(0) * hash) % 100;
      return hashB - hashA;
    });

    return shuffled.slice(0, 10);
  }, [rawCategories]);`;

content = content.replace(/const top10Movies = useMemo\(\(\) => \{[\s\S]*?\}, \[categories\]\);/, newTop10);

// Also need to fix the Top 10 title inside Top10Rail
content = content.replace(/<h3 style=\{\{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' \}\}>🔥 Top 10 Today<\/h3>/,
  `<h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
        <span style={{ color: '#e50914', marginRight: '8px' }}>Top 10</span>
        in Your Country Today
      </h3>`);

fs.writeFileSync('frontend/src/pages/Home.jsx', content);
