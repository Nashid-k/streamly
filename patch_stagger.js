const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Home.jsx', 'utf8');

// 1. Update component signatures
content = content.replace(/const MovieRail = React\.memo\(function MovieRail\(\{ category \}\) \{/, 
  'const MovieRail = React.memo(function MovieRail({ category, railIndex = 0 }) {');

content = content.replace(/const Top10Rail = React\.memo\(function Top10Rail\(\{ movies, filter \}\) \{/, 
  'const Top10Rail = React.memo(function Top10Rail({ movies, filter, railIndex = 0 }) {');

// 2. Update transition delay in MovieRail
content = content.replace(/transition=\{\{ duration: 0\.5, delay: i \* 0\.05, ease: "easeOut" \}\}/, 
  'transition={{ duration: 0.5, delay: (railIndex % 5) * 0.3 + (i * 0.05), ease: "easeOut" }}');

// 3. Update transition delay in Top10Rail
content = content.replace(/transition=\{\{ duration: 0\.5, delay: i \* 0\.05, ease: "easeOut" \}\}/, 
  'transition={{ duration: 0.5, delay: (railIndex % 5) * 0.3 + (i * 0.05), ease: "easeOut" }}');

// 4. Update usages in render
content = content.replace(/<MovieRail category=\{\{ name: 'Continue Watching', movies: continueWatching \}\} \/>/, 
  '<MovieRail railIndex={0} category={{ name: "Continue Watching", movies: continueWatching }} />');

content = content.replace(/<MovieRail category=\{\{ name: `Because you watched \$\{lastWatched\.title\}`, movies: recommendations \}\} \/>/, 
  '<MovieRail railIndex={1} category={{ name: `Because you watched ${lastWatched.title}`, movies: recommendations }} />');

content = content.replace(/<MovieRail category=\{\{ name: 'My List', movies: myList \}\} \/>/, 
  '<MovieRail railIndex={2} category={{ name: "My List", movies: myList }} />');

content = content.replace(/<Top10Rail movies=\{top10Movies\} filter=\{filter\} \/>/, 
  '<Top10Rail railIndex={3} movies={top10Movies} filter={filter} />');

content = content.replace(/<MovieRail category=\{category\} \/>/, 
  '<MovieRail railIndex={catIdx + 4} category={category} />');

fs.writeFileSync('frontend/src/pages/Home.jsx', content);
