const fs = require('fs');
const files = [
  'frontend/src/pages/SearchPage.jsx',
  'frontend/src/pages/GenrePage.jsx',
  'frontend/src/pages/WatchlistPage.jsx',
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the entire block starting with <motion.div key={movie.id} and ending with > before <Link
  content = content.replace(/<motion\.div\s*key=\{movie\.id\}[\s\S]*?>\s*<Link to/g, 
    `<motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (idx % 20) * 0.05, ease: "easeOut" }}
              >
                <Link to`);
  fs.writeFileSync(file, content);
}
