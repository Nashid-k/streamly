const fs = require('fs');
const file = 'src/pages/Home.jsx';
let jsx = fs.readFileSync(file, 'utf8');

// Replace the inline style on the Top 10 span with the premium class
jsx = jsx.replace(
  /position: 'absolute', bottom: '-10px', left: '-25px', fontSize: '8rem', fontWeight: 900,\s*color: 'transparent', WebkitTextStroke: '3px rgba\(255,255,255,0\.6\)',\s*lineHeight: 1, zIndex: 2, pointerEvents: 'none', userSelect: 'none',\s*textShadow: '0 4px 20px rgba\(0,0,0,0\.8\)'/,
  `position: 'absolute', bottom: '-10px', left: '-25px', fontSize: '8rem', fontWeight: 900, lineHeight: 1, zIndex: 2, pointerEvents: 'none', userSelect: 'none'`
);

jsx = jsx.replace(
  /<span style={{/g,
  '<span className="text-stroke-premium" style={{'
);

// We need to specifically target the span in Top10Rail
// A safer way is to just replace the whole span tag for Top10Rail
