const fs = require('fs');
let content = fs.readFileSync('frontend/src/index.css', 'utf8');

// Add performance optimizations to movie-card
content = content.replace(/\.movie-card \{/, \`.movie-card {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000;\`);

fs.writeFileSync('frontend/src/index.css', content);
