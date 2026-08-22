const fs = require('fs');
const file = 'src/App.jsx';
let jsx = fs.readFileSync(file, 'utf8');

// The mobile search currently has ref={searchRef}. Let's remove it.
// We can find the mobile one by looking for 'className="search-wrapper mobile-search"'
jsx = jsx.replace(
  /<div ref=\{searchRef\} className="search-wrapper mobile-search"/,
  '<div className="search-wrapper mobile-search"'
);

fs.writeFileSync(file, jsx);
console.log('App.jsx mobile search ref fixed');
