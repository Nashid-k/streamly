const fs = require('fs');

const staggerAnim = `<motion.div 
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (idx % 20) * 0.05, ease: "easeOut" }}
                >`;

const files = [
  'frontend/src/pages/SearchPage.jsx',
  'frontend/src/pages/GenrePage.jsx',
  'frontend/src/pages/WatchlistPage.jsx',
  'frontend/src/pages/HistoryPage.jsx',
  'frontend/src/pages/MovieDetails.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if(file.includes('SearchPage') || file.includes('GenrePage') || file.includes('WatchlistPage')) {
    // These have AnimatePresence and variants
    content = content.replace(/<motion\.div\s*key=\{movie\.id\}\s*layout[\s\S]*?exit=\{[^}]+\}\s*>/, staggerAnim);
    // Also remove the parent motion.div variants that staggerChildren, if present.
    content = content.replace(/variants=\{\{\s*hidden:[\s\S]*?staggerChildren[\s\S]*?\}\s*\}\s*>/, '>');
  } else if (file.includes('HistoryPage')) {
    // HistoryPage might use different naming
    content = content.replace(/<motion\.div\s*key=\{movie\.id\}\s*layout[\s\S]*?exit=\{[^}]+\}\s*>/, staggerAnim);
  } else if (file.includes('MovieDetails')) {
    // MovieDetails similar movies
    content = content.replace(/<motion\.div key=\{`\$\{sim\.id\}-\$\{idx\}`\} variants=\{cardVariants\}>/, 
    `<motion.div 
                  key={\`\${sim.id}-\${idx}\`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (idx % 12) * 0.05, ease: "easeOut" }}
                >`);
    content = content.replace(/variants=\{gridVariants\}\s*initial="hidden"\s*whileInView="show"/, '');
  }
  fs.writeFileSync(file, content);
});
