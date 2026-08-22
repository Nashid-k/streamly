const fs = require('fs');
const file = 'src/App.jsx';
let jsx = fs.readFileSync(file, 'utf8');

// The nav-links have <Link to="..." className="...">Text</Link>
// We need to add onClick={() => setMobileMenuOpen(false)} to them
jsx = jsx.replace(
  /<Link to="([^"]+)" className={`nav-item \$\{location\.pathname([^}]+)\}`}/g,
  '<Link onClick={() => setMobileMenuOpen(false)} to="$1" className={`nav-item ${location.pathname$2}`}'
);

fs.writeFileSync(file, jsx);
console.log('App.jsx navlinks click fixed');
