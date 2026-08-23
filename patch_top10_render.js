const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Home.jsx', 'utf8');

// Update Top10Rail usage to allow series and movies
content = content.replace(/\{filter === 'all' && top10Movies\.length > 0 && activeGenre === 'All' && \(/, 
  `{(filter === 'all' || filter === 'series' || filter === 'movies') && top10Movies.length > 0 && activeGenre === 'All' && (`);

// And we need to filter top10Movies based on the active tab!
content = content.replace(/return shuffled\.slice\(0, 10\);\n  \}, \[rawCategories\]\);/,
  `const finalTop10 = filter === 'series' 
      ? shuffled.filter(m => m.isSeries) 
      : filter === 'movies' 
        ? shuffled.filter(m => !m.isSeries) 
        : shuffled;
    
    return finalTop10.slice(0, 10);
  }, [rawCategories, filter]);`);

// Pass filter to Top10Rail
content = content.replace(/<Top10Rail movies=\{top10Movies\} \/>/, `<Top10Rail movies={top10Movies} filter={filter} />`);

// Update Top10Rail component to accept filter and change title
content = content.replace(/const Top10Rail = React\.memo\(function Top10Rail\(\{ movies \}\) \{/, 
  `const Top10Rail = React.memo(function Top10Rail({ movies, filter }) {`);

content = content.replace(/<span style=\{\{ color: '#e50914', marginRight: '8px' \}\}>Top 10<\/span>\n        in Your Country Today/,
  `<span style={{ color: '#e50914', marginRight: '8px' }}>Top 10</span>
        {filter === 'series' ? 'TV Shows ' : filter === 'movies' ? 'Movies ' : ''}in Your Country Today`);

fs.writeFileSync('frontend/src/pages/Home.jsx', content);
