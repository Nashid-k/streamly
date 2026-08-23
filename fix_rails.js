const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Home.jsx', 'utf8');

content = content.replace(/scrollBehavior: 'smooth',\s*/g, '');

const newScroll = `  const scroll = (dir) => {
    if (railRef.current) {
      const clientWidth = railRef.current.clientWidth;
      const scrollAmount = clientWidth > 800 ? clientWidth * 0.8 : clientWidth * 0.9;
      railRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };`;
content = content.replace(/const scroll = \(dir\) => \{[\s\S]*?railRef\.current\.scrollBy\(\{ left: dir === 'left' \? -600 : 600, behavior: 'smooth' \}\);\n    \}\n  \};/g, newScroll);

const staggerMovieRail = `            {category.movies.map((movie, i) => (
          <motion.div
            key={\`\${movie.id}-\${i}\`}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10px" }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
            style={{ flexShrink: 0 }}
          >
            <Link to={\`/movie/\${movie.source || 'nflix'}/\${movie.id}\`}>
              <div className="movie-card" style={{ width: '200px' }}>`;
content = content.replace(/\{category\.movies\.map\(\(movie, i\) => \(\n\s*<Link to=\{`\/movie\/\$\{movie\.source \|\| 'nflix'\}\/\$\{movie\.id\}`\} key=\{`\$\{movie\.id\}-\$\{i\}`\} style=\{\{ flexShrink: 0 \}\}>\n\s*<div className="movie-card" style=\{\{ width: '200px', flexShrink: 0 \}\}>/, staggerMovieRail);

content = content.replace(/<\/Link>\n\s*\)\)}/g, `</Link>\n          </motion.div>\n        ))}`);

const staggerTop10 = `        {top10.map((movie, i) => (
          <motion.div
            key={\`top10-\${movie.id}\`}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10px" }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
            style={{ flexShrink: 0 }}
          >
            <Link to={\`/movie/\${movie.source || 'nflix'}/\${movie.id}\`}>`;
content = content.replace(/\{top10\.map\(\(movie, i\) => \(\n\s*<Link to=\{`\/movie\/\$\{movie\.source \|\| 'nflix'\}\/\$\{movie\.id\}`\} key=\{`top10-\$\{movie\.id\}`\} style=\{\{ flexShrink: 0 \}\}>/, staggerTop10);

fs.writeFileSync('frontend/src/pages/Home.jsx', content);
